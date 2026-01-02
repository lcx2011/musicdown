/**
 * Tests for DownloadService
 */

import { DownloadService } from './DownloadService';
import { APIClient } from './APIClient';
import { FileSystemManager } from './FileSystemManager';
import { Video, DownloadState, ExtractionResponse } from '../types';

// Mock dependencies
jest.mock('./APIClient');
jest.mock('./FileSystemManager');
jest.mock('axios');

describe('DownloadService', () => {
  let downloadService: DownloadService;
  let mockApiClient: jest.Mocked<APIClient>;
  let mockFileSystemManager: jest.Mocked<FileSystemManager>;

  const mockVideo: Video = {
    id: 'BV1234567890',
    title: 'Test Video',
    thumbnail: 'https://example.com/thumb.jpg',
    duration: '10:30',
    uploader: 'Test Uploader',
    videoUrl: 'https://www.bilibili.com/video/BV1234567890',
  };

  const mockExtractionResponse: ExtractionResponse = {
    text: 'Success',
    medias: [
      {
        media_type: 'video/mp4',
        resource_url: 'https://example.com/video.mp4',
        preview_url: 'https://example.com/preview.jpg',
      },
    ],
    overseas: 0,
  };

  beforeEach(() => {
    // Create mock instances
    mockApiClient = new APIClient() as jest.Mocked<APIClient>;
    mockFileSystemManager = new FileSystemManager() as jest.Mocked<FileSystemManager>;

    // Setup default mock implementations
    mockApiClient.extractVideo = jest.fn().mockResolvedValue(mockExtractionResponse);
    mockFileSystemManager.saveFile = jest.fn().mockResolvedValue('/path/to/desktop/Test Video.mp4');

    // Mock axios for download
    const axios = require('axios');
    axios.get = jest.fn().mockResolvedValue({
      data: Buffer.from('mock video data'),
    });

    downloadService = new DownloadService(mockApiClient, mockFileSystemManager, 3);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadVideo', () => {
    it('should initiate download and return success result', async () => {
      const result = await downloadService.downloadVideo(mockVideo);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/path/to/desktop/Test Video.mp4');
      expect(mockApiClient.extractVideo).toHaveBeenCalledWith(mockVideo.videoUrl);
      expect(mockFileSystemManager.saveFile).toHaveBeenCalled();
    });

    it('should track download state during download', async () => {
      const stateChanges: DownloadState[] = [];
      
      downloadService.addEventListener((download) => {
        stateChanges.push(download.state);
      });

      await downloadService.downloadVideo(mockVideo);

      expect(stateChanges).toContain(DownloadState.DOWNLOADING);
      expect(stateChanges).toContain(DownloadState.COMPLETED);
    });

    it('should prevent duplicate downloads for the same video', async () => {
      // Make the API call slow so we can test concurrent requests
      mockApiClient.extractVideo = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockExtractionResponse), 100))
      );

      // Start first download (don't await yet)
      const promise1 = downloadService.downloadVideo(mockVideo);
      
      // Try to start second download immediately while first is in progress
      const promise2 = downloadService.downloadVideo(mockVideo);

      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // API should only be called once (duplicate prevented)
      expect(mockApiClient.extractVideo).toHaveBeenCalledTimes(1);
    });

    it('should handle download errors and reset state', async () => {
      const error = new Error('Download failed');
      mockApiClient.extractVideo = jest.fn().mockRejectedValue(error);

      const result = await downloadService.downloadVideo(mockVideo);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download failed');

      const download = downloadService.getAllDownloads().find(d => d.videoId === mockVideo.id);
      expect(download?.state).toBe(DownloadState.FAILED);
      expect(download?.error).toBe('Download failed');
    });

    it('should select MP4 format when available', async () => {
      const multiFormatResponse: ExtractionResponse = {
        text: 'Success',
        medias: [
          {
            media_type: 'video/webm',
            resource_url: 'https://example.com/video.webm',
            preview_url: 'https://example.com/preview.jpg',
          },
          {
            media_type: 'video/mp4',
            resource_url: 'https://example.com/video.mp4',
            preview_url: 'https://example.com/preview.jpg',
          },
        ],
        overseas: 0,
      };

      mockApiClient.extractVideo = jest.fn().mockResolvedValue(multiFormatResponse);

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({
        data: Buffer.from('mock video data'),
      });

      await downloadService.downloadVideo(mockVideo);

      // Should download the MP4 URL
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/video.mp4',
        expect.any(Object)
      );
    });

    it('should fall back to first format if no MP4 available', async () => {
      const nonMp4Response: ExtractionResponse = {
        text: 'Success',
        medias: [
          {
            media_type: 'video/webm',
            resource_url: 'https://example.com/video.webm',
            preview_url: 'https://example.com/preview.jpg',
          },
        ],
        overseas: 0,
      };

      mockApiClient.extractVideo = jest.fn().mockResolvedValue(nonMp4Response);

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({
        data: Buffer.from('mock video data'),
      });

      await downloadService.downloadVideo(mockVideo);

      // Should download the first available format
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/video.webm',
        expect.any(Object)
      );
    });
  });

  describe('isDownloading', () => {
    it('should return true when video is downloading', async () => {
      // Start download but don't await
      const promise = downloadService.downloadVideo(mockVideo);

      expect(downloadService.isDownloading(mockVideo.id)).toBe(true);

      await promise;
    });

    it('should return false when video is not downloading', () => {
      expect(downloadService.isDownloading(mockVideo.id)).toBe(false);
    });
  });

  describe('getDownloadProgress', () => {
    it('should return null for non-existent download', () => {
      const progress = downloadService.getDownloadProgress('non-existent');
      expect(progress).toBeNull();
    });

    it('should return progress information for active download', async () => {
      const promise = downloadService.downloadVideo(mockVideo);

      const progress = downloadService.getDownloadProgress(mockVideo.id);
      expect(progress).not.toBeNull();
      expect(progress?.videoId).toBe(mockVideo.id);
      expect(progress?.state).toBe(DownloadState.DOWNLOADING);

      await promise;
    });
  });

  describe('event listeners', () => {
    it('should notify listeners of state changes', async () => {
      const listener = jest.fn();
      downloadService.addEventListener(listener);

      await downloadService.downloadVideo(mockVideo);

      expect(listener).toHaveBeenCalled();
      
      // Should be called at least twice: DOWNLOADING and COMPLETED
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow removing event listeners', async () => {
      const listener = jest.fn();
      downloadService.addEventListener(listener);
      downloadService.removeEventListener(listener);

      await downloadService.downloadVideo(mockVideo);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('concurrent download limits', () => {
    it('should limit concurrent downloads to max specified', async () => {
      const videos: Video[] = [
        { ...mockVideo, id: 'BV1' },
        { ...mockVideo, id: 'BV2' },
        { ...mockVideo, id: 'BV3' },
        { ...mockVideo, id: 'BV4' },
      ];

      // Start 4 downloads (max is 3)
      const promises = videos.map(v => downloadService.downloadVideo(v));

      // All should eventually complete
      const results = await Promise.all(promises);
      
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
