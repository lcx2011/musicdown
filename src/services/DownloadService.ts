/**
 * DownloadService - Manages video download operations
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 8.5
 */

import axios from 'axios';
import { Video, Download, DownloadState, MediaInfo } from '../types';
import { APIClient } from './APIClient';
import { FileSystemManager } from './FileSystemManager';

/**
 * Result of a download operation
 */
export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  videoId: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  state: DownloadState;
}

/**
 * Event listener for download state changes
 */
export type DownloadEventListener = (download: Download) => void;

/**
 * Service for managing video downloads
 * 
 * Requirements:
 * - 4.1: Initiate download process immediately on button click
 * - 4.2: Display progress indicator and track download state
 * - 4.3: Prevent duplicate downloads for the same video
 * - 4.5: Handle download errors and reset state
 * - 4.6: Update button to indicate completion status
 * - 8.5: Prefer MP4 format when available
 */
export class DownloadService {
  private downloads: Map<string, Download>;
  private downloadPromises: Map<string, Promise<DownloadResult>>;
  private eventListeners: DownloadEventListener[];
  private apiClient: APIClient;
  private fileSystemManager: FileSystemManager;
  private maxConcurrentDownloads: number;
  private activeDownloads: number;

  constructor(
    apiClient: APIClient,
    fileSystemManager: FileSystemManager,
    maxConcurrentDownloads: number = 3
  ) {
    this.downloads = new Map();
    this.downloadPromises = new Map();
    this.eventListeners = [];
    this.apiClient = apiClient;
    this.fileSystemManager = fileSystemManager;
    this.maxConcurrentDownloads = maxConcurrentDownloads;
    this.activeDownloads = 0;
  }

  /**
   * Add an event listener for download state changes
   * Requirements: 4.2, 4.6
   */
  addEventListener(listener: DownloadEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: DownloadEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit a download state change event
   * Requirements: 4.2, 4.6
   */
  private emitEvent(download: Download): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(download);
      } catch (error) {
        console.error('Error in download event listener:', error);
      }
    });
  }

  /**
   * Update download state and emit event
   * Requirements: 4.2, 4.6
   */
  private updateDownloadState(
    videoId: string,
    updates: Partial<Download>
  ): void {
    const download = this.downloads.get(videoId);
    if (!download) {
      return;
    }

    // Update the download object
    Object.assign(download, updates);

    // Emit state change event
    this.emitEvent(download);
  }

  /**
   * Select MP4 format from media array, or fall back to first available
   * Requirements: 8.5
   */
  private selectMediaFormat(medias: MediaInfo[]): MediaInfo | null {
    if (medias.length === 0) {
      return null;
    }

    // Prefer MP4 format
    const mp4Media = medias.find(
      media => media.media_type.toLowerCase().includes('mp4')
    );

    if (mp4Media) {
      return mp4Media;
    }

    // Fall back to first available format
    return medias[0];
  }

  /**
   * Get current download progress for a video
   * Requirements: 4.2
   */
  getDownloadProgress(videoId: string): DownloadProgress | null {
    const download = this.downloads.get(videoId);
    if (!download) {
      return null;
    }

    return {
      videoId: download.videoId,
      bytesDownloaded: download.bytesDownloaded,
      totalBytes: download.totalBytes,
      percentage: download.progress,
      state: download.state,
    };
  }

  /**
   * Get all current downloads
   */
  getAllDownloads(): Download[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Check if a video is currently being downloaded
   * Requirements: 4.3
   */
  isDownloading(videoId: string): boolean {
    const download = this.downloads.get(videoId);
    return download?.state === DownloadState.DOWNLOADING;
  }

  /**
   * Download a video
   * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 8.5
   * 
   * @param video - Video metadata
   * @returns Promise resolving to download result
   */
  async downloadVideo(video: Video): Promise<DownloadResult> {
    // Requirements: 4.3 - Prevent duplicate downloads
    if (this.isDownloading(video.id)) {
      // Return existing download promise
      const existingPromise = this.downloadPromises.get(video.id);
      if (existingPromise) {
        return existingPromise;
      }
    }

    // Create download promise
    const downloadPromise = this.executeDownload(video);
    this.downloadPromises.set(video.id, downloadPromise);

    // Clean up promise when done
    downloadPromise.finally(() => {
      this.downloadPromises.delete(video.id);
    });

    return downloadPromise;
  }

  /**
   * Execute the actual download operation
   * Requirements: 4.1, 4.2, 4.5, 4.6, 8.5
   */
  private async executeDownload(video: Video): Promise<DownloadResult> {
    // Wait if we've reached max concurrent downloads
    while (this.activeDownloads >= this.maxConcurrentDownloads) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeDownloads++;

    try {
      // Requirements: 4.2 - Initialize download state
      const download: Download = {
        videoId: video.id,
        video: video,
        state: DownloadState.DOWNLOADING,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: 0,
        startTime: new Date(),
      };

      this.downloads.set(video.id, download);
      this.emitEvent(download);

      // Step 1: Extract video information from API
      const extractionResponse = await this.apiClient.extractVideo(video.videoUrl);

      // Requirements: 8.5 - Select MP4 format when available
      const selectedMedia = this.selectMediaFormat(extractionResponse.medias);

      if (!selectedMedia) {
        throw new Error('No media formats available for download');
      }

      const downloadUrl = selectedMedia.resource_url;

      // Step 2: Download the video file
      // Use Electron IPC if available (bypasses CORS), otherwise fall back to axios
      let videoBuffer: Buffer;
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Use Electron IPC to download (main process handles headers)
        const result = await window.electronAPI.downloadVideo(downloadUrl, true);
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Download failed');
        }
        
        videoBuffer = Buffer.from(result.data);
        
        // Update final progress
        this.updateDownloadState(video.id, {
          bytesDownloaded: videoBuffer.length,
          totalBytes: videoBuffer.length,
          progress: 100,
        });
      } else {
        // Fallback to axios (may fail due to CORS)
        const response = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          headers: {
            'Referer': 'https://www.bilibili.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          onDownloadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            const downloaded = progressEvent.loaded || 0;
            const percentage = total > 0 ? Math.round((downloaded / total) * 100) : 0;

            // Requirements: 4.2 - Update progress
            this.updateDownloadState(video.id, {
              bytesDownloaded: downloaded,
              totalBytes: total,
              progress: percentage,
            });
          },
        });

        videoBuffer = Buffer.from(response.data);
      }

      // Step 3: Save file to desktop
      const filename = `${video.title}.mp4`;
      const filePath = await this.fileSystemManager.saveFile(filename, videoBuffer);

      // Requirements: 4.6 - Update to completed state
      this.updateDownloadState(video.id, {
        state: DownloadState.COMPLETED,
        progress: 100,
        filePath: filePath,
        endTime: new Date(),
      });

      return {
        success: true,
        filePath: filePath,
      };
    } catch (error) {
      // Requirements: 4.5 - Handle download errors and reset state
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.updateDownloadState(video.id, {
        state: DownloadState.FAILED,
        error: errorMessage,
        endTime: new Date(),
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.activeDownloads--;
    }
  }

  /**
   * Reset download state to IDLE
   * Requirements: 4.5
   */
  resetDownload(videoId: string): void {
    const download = this.downloads.get(videoId);
    if (!download) {
      return;
    }

    this.updateDownloadState(videoId, {
      state: DownloadState.IDLE,
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      error: undefined,
      filePath: undefined,
    });
  }

  /**
   * Cancel an in-progress download
   */
  cancelDownload(videoId: string): void {
    // Note: Actual cancellation would require AbortController
    // For now, we just reset the state
    this.resetDownload(videoId);
  }

  /**
   * Clear completed or failed downloads from tracking
   */
  clearDownload(videoId: string): void {
    this.downloads.delete(videoId);
    this.downloadPromises.delete(videoId);
  }
}
