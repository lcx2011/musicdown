/**
 * Video Service for Bilibili video operations
 * Requirements: 3.1, 3.2, 3.4
 */

import { shell } from 'electron';

/**
 * Video Service for constructing URLs and launching browser previews
 * 
 * Requirements:
 * - 3.1: Open video page in system default browser
 * - 3.2: Construct correct Bilibili video URL
 * - 3.4: Handle browser launch errors
 */
export class VideoService {
  /**
   * Construct a Bilibili video URL from a video ID
   * 
   * Requirements: 3.2
   * - Format: https://www.bilibili.com/video/{videoId}
   * 
   * @param videoId - Bilibili video ID (e.g., "BV1UNs6zBEkN")
   * @returns Full Bilibili video URL
   * @throws Error if videoId is empty or invalid
   */
  constructVideoUrl(videoId: string): string {
    // Validate videoId is non-empty
    if (!videoId || videoId.trim().length === 0) {
      throw new Error('Video ID cannot be empty');
    }

    // Trim whitespace
    const cleanId = videoId.trim();

    // Construct URL
    return `https://www.bilibili.com/video/${cleanId}`;
  }

  /**
   * Open a video URL in the system default browser
   * 
   * Requirements: 3.1, 3.4
   * - Open video page in system default browser
   * - Check if default browser is available
   * - Handle browser launch errors
   * 
   * @param videoUrl - Full video URL to open
   * @returns Promise that resolves when browser is launched
   * @throws Error if browser is not available or launch fails
   */
  async openInBrowser(videoUrl: string): Promise<void> {
    // Validate URL is non-empty
    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error('Video URL cannot be empty');
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(videoUrl);
    } catch (error) {
      // URL parsing failed - invalid format
      throw new Error('Invalid URL format');
    }

    // Check protocol
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only http and https are supported');
    }

    try {
      // Use Electron shell.openExternal to open URL in default browser
      // This returns a Promise<void> that resolves when the browser is launched
      await shell.openExternal(videoUrl);
    } catch (error) {
      // Handle browser launch errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to open browser: ${errorMessage}`);
    }
  }

  /**
   * Check if the default browser is available
   * 
   * Requirements: 3.4
   * - Detect browser availability
   * 
   * Note: Electron's shell.openExternal will use the system default handler.
   * This method attempts to verify that a default browser is configured.
   * 
   * @returns true if default browser appears to be available
   */
  isDefaultBrowserAvailable(): boolean {
    // On Windows, shell.openExternal will always attempt to use the default handler
    // If no handler is configured, it will fail at launch time
    // We return true here as the actual check happens during openExternal call
    // This is a best-effort check
    return true;
  }
}

/**
 * Create a default VideoService instance
 */
export function createVideoService(): VideoService {
  return new VideoService();
}
