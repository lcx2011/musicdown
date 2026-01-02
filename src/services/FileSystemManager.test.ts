/**
 * Tests for FileSystemManager
 */

import { FileSystemManager } from './FileSystemManager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock Electron API
const mockElectronAPI = {
  getDesktopPath: jest.fn(),
  fileExists: jest.fn(),
  checkDiskSpace: jest.fn(),
  saveFile: jest.fn()
};

describe('FileSystemManager', () => {
  let fsManager: FileSystemManager;
  const testDesktopPath = path.join(os.homedir(), 'Desktop');

  beforeEach(() => {
    fsManager = new FileSystemManager();
    
    // Setup default mocks
    mockElectronAPI.getDesktopPath.mockResolvedValue({
      success: true,
      path: testDesktopPath
    });
    
    mockElectronAPI.fileExists.mockResolvedValue({
      success: true,
      exists: false
    });
    
    mockElectronAPI.checkDiskSpace.mockResolvedValue({
      success: true,
      hasSpace: true
    });
    
    mockElectronAPI.saveFile.mockResolvedValue({
      success: true
    });
    
    // Mock window.electronAPI in jsdom environment
    Object.defineProperty(window, 'electronAPI', {
      writable: true,
      configurable: true,
      value: mockElectronAPI
    });
  });

  afterEach(() => {
    // Clean up mocks
    delete (window as any).electronAPI;
    jest.clearAllMocks();
  });

  describe('getDesktopPath', () => {
    it('should return a path containing Desktop', async () => {
      const desktopPath = await fsManager.getDesktopPath();
      expect(desktopPath).toContain('Desktop');
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath.length).toBeGreaterThan(0);
    });

    it('should return a path in the user home directory', async () => {
      const desktopPath = await fsManager.getDesktopPath();
      const homeDir = os.homedir();
      expect(desktopPath).toContain(homeDir);
    });
  });

  describe('fileExists', () => {
    it('should return false for non-existent file', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({
        success: true,
        exists: false
      });
      
      const result = await fsManager.fileExists('/nonexistent/path/file.txt');
      expect(result).toBe(false);
    });

    it('should return true for existing file', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({
        success: true,
        exists: true
      });
      
      const thisFile = __filename;
      const result = await fsManager.fileExists(thisFile);
      expect(result).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid Windows characters with underscores', () => {
      const input = 'video<>:"/\\|?*.mp4';
      const result = fsManager.sanitizeFilename(input);
      expect(result).toBe('video_________.mp4');
      expect(result).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should handle empty string by returning default name', () => {
      const result = fsManager.sanitizeFilename('');
      expect(result).toBe('video');
    });

    it('should handle whitespace-only string', () => {
      const result = fsManager.sanitizeFilename('   ');
      expect(result).toBe('video');
    });

    it('should handle all invalid characters', () => {
      const result = fsManager.sanitizeFilename('<>:"/\\|?*');
      expect(result).toBe('video');
    });

    it('should truncate filenames longer than 255 characters', () => {
      const longName = 'a'.repeat(300) + '.mp4';
      const result = fsManager.sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should preserve valid characters', () => {
      const input = 'My Video Title 2024.mp4';
      const result = fsManager.sanitizeFilename(input);
      expect(result).toBe('My Video Title 2024.mp4');
    });
  });

  describe('getUniqueFilename', () => {
    it('should return original filename if no conflict', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({
        success: true,
        exists: false
      });
      
      const result = await fsManager.getUniqueFilename(testDesktopPath, 'video.mp4');
      expect(result).toBe('video.mp4');
    });

    it('should append (1) if file exists', async () => {
      // First call returns exists=true, second call returns exists=false
      mockElectronAPI.fileExists
        .mockResolvedValueOnce({ success: true, exists: true })
        .mockResolvedValueOnce({ success: true, exists: false });

      const result = await fsManager.getUniqueFilename(testDesktopPath, 'video.mp4');
      expect(result).toBe('video(1).mp4');
    });

    it('should increment counter for multiple conflicts', async () => {
      // Mock multiple existing files
      mockElectronAPI.fileExists
        .mockResolvedValueOnce({ success: true, exists: true })  // video.mp4
        .mockResolvedValueOnce({ success: true, exists: true })  // video(1).mp4
        .mockResolvedValueOnce({ success: true, exists: true })  // video(2).mp4
        .mockResolvedValueOnce({ success: true, exists: false }); // video(3).mp4

      const result = await fsManager.getUniqueFilename(testDesktopPath, 'video.mp4');
      expect(result).toBe('video(3).mp4');
    });
  });

  describe('saveFile', () => {
    it('should save file and return full path', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({
        success: true,
        exists: false
      });
      
      mockElectronAPI.saveFile.mockResolvedValue({
        success: true
      });

      const data = Buffer.from('test video data');
      const filename = 'test-video.mp4';

      const result = await fsManager.saveFile(filename, data);

      expect(result).toContain(testDesktopPath);
      expect(result).toContain('test-video.mp4');
      expect(mockElectronAPI.saveFile).toHaveBeenCalled();
    });

    it('should sanitize filename before saving', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({
        success: true,
        exists: false
      });
      
      mockElectronAPI.saveFile.mockResolvedValue({
        success: true
      });

      const data = Buffer.from('test data');
      const filename = 'video<>:test.mp4';

      const result = await fsManager.saveFile(filename, data);

      // Check that the filename part doesn't contain invalid characters
      expect(result).toContain('video__');
      expect(result).not.toMatch(/[<>]/);
    });

    it('should handle filename conflicts', async () => {
      // First call for checking original filename returns exists=true
      // Second call for checking unique filename returns exists=false
      mockElectronAPI.fileExists
        .mockResolvedValueOnce({ success: true, exists: true })
        .mockResolvedValueOnce({ success: true, exists: false });
      
      mockElectronAPI.saveFile.mockResolvedValue({
        success: true
      });

      const data = Buffer.from('new data');
      const result = await fsManager.saveFile('video.mp4', data);

      expect(result).toContain('video(1).mp4');
    });
  });

  describe('checkDiskSpace', () => {
    it('should return a boolean', async () => {
      const result = await fsManager.checkDiskSpace();
      expect(typeof result).toBe('boolean');
    });

    it('should accept custom required bytes', async () => {
      const result = await fsManager.checkDiskSpace(1024);
      expect(typeof result).toBe('boolean');
    });
  });
});

