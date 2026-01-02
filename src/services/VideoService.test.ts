/**
 * Tests for VideoService
 * Requirements: 3.1, 3.2, 3.4
 */

import { VideoService } from './VideoService';

// Mock electron shell module
jest.mock('electron', () => ({
  shell: {
    openExternal: jest.fn(),
  },
}));

import { shell } from 'electron';

describe('VideoService', () => {
  let videoService: VideoService;

  beforeEach(() => {
    videoService = new VideoService();
    jest.clearAllMocks();
  });

  describe('constructVideoUrl', () => {
    it('should construct correct Bilibili URL from video ID', () => {
      // Requirement 3.2: Format should be https://www.bilibili.com/video/{videoId}
      const videoId = 'BV1UNs6zBEkN';
      const url = videoService.constructVideoUrl(videoId);
      
      expect(url).toBe('https://www.bilibili.com/video/BV1UNs6zBEkN');
    });

    it('should trim whitespace from video ID', () => {
      const videoId = '  BV1UNs6zBEkN  ';
      const url = videoService.constructVideoUrl(videoId);
      
      expect(url).toBe('https://www.bilibili.com/video/BV1UNs6zBEkN');
    });

    it('should throw error for empty video ID', () => {
      expect(() => videoService.constructVideoUrl('')).toThrow('Video ID cannot be empty');
    });

    it('should throw error for whitespace-only video ID', () => {
      expect(() => videoService.constructVideoUrl('   ')).toThrow('Video ID cannot be empty');
    });
  });

  describe('openInBrowser', () => {
    it('should call shell.openExternal with the video URL', async () => {
      // Requirement 3.1: Open video page in system default browser
      const videoUrl = 'https://www.bilibili.com/video/BV1UNs6zBEkN';
      (shell.openExternal as jest.Mock).mockResolvedValue(undefined);

      await videoService.openInBrowser(videoUrl);

      expect(shell.openExternal).toHaveBeenCalledWith(videoUrl);
      expect(shell.openExternal).toHaveBeenCalledTimes(1);
    });

    it('should throw error for empty URL', async () => {
      await expect(videoService.openInBrowser('')).rejects.toThrow('Video URL cannot be empty');
    });

    it('should throw error for invalid URL format', async () => {
      await expect(videoService.openInBrowser('not-a-url')).rejects.toThrow('Invalid URL format');
    });

    it('should throw error for invalid URL protocol', async () => {
      await expect(videoService.openInBrowser('ftp://example.com')).rejects.toThrow('Invalid URL protocol');
    });

    it('should handle browser launch errors', async () => {
      // Requirement 3.4: Handle browser launch errors
      const videoUrl = 'https://www.bilibili.com/video/BV1UNs6zBEkN';
      const error = new Error('Browser not found');
      (shell.openExternal as jest.Mock).mockRejectedValue(error);

      await expect(videoService.openInBrowser(videoUrl)).rejects.toThrow('Failed to open browser: Browser not found');
    });
  });

  describe('isDefaultBrowserAvailable', () => {
    it('should return true indicating browser availability check', () => {
      // Requirement 3.4: Check if default browser is available
      const isAvailable = videoService.isDefaultBrowserAvailable();
      
      expect(isAvailable).toBe(true);
    });
  });
});
