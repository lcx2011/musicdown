/**
 * Tests for FileSystemManager
 */

import { FileSystemManager } from './FileSystemManager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as fc from 'fast-check';

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

    // Feature: bilibili-downloader-win7, Property 17: Filename sanitization
    // For any video title containing Windows-invalid characters (< > : " / \ | ? *), 
    // the sanitized filename should replace those characters with safe alternatives and remain non-empty.
    // Validates: Requirements 8.2
    it('should sanitize any filename with invalid characters', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0),
          (filename) => {
            const sanitized = fsManager.sanitizeFilename(filename);
            
            // Property 1: No Windows-invalid characters remain
            const invalidChars = /[<>:"/\\|?*]/;
            expect(sanitized).not.toMatch(invalidChars);
            
            // Property 2: Result is non-empty
            expect(sanitized.length).toBeGreaterThan(0);
            
            // Property 3: Result is a valid Windows filename (length <= 255)
            expect(sanitized.length).toBeLessThanOrEqual(255);
          }
        ),
        { numRuns: 100 }
      );
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

    // Feature: bilibili-downloader-win7, Property 18: Filename conflict resolution
    // For any video download where a file with the same name exists, 
    // the new filename should have a numeric suffix appended (e.g., "video(1).mp4", "video(2).mp4").
    // Validates: Requirements 8.3
    it('should append numeric suffix for any filename with conflicts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random filenames with various extensions
          // Exclude path separators (/ and \) since getUniqueFilename expects filenames, not paths
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => s.trim().length > 0)
              .filter(s => !s.includes('/') && !s.includes('\\')),
            fc.constantFrom('.mp4', '.avi', '.mkv', '.mov', '.txt', '')
          ).map(([name, ext]) => name + ext),
          // Generate number of conflicts (0-5)
          fc.integer({ min: 0, max: 5 }),
          async (filename, numConflicts) => {
            // Mock fileExists to return true for the first numConflicts calls, then false
            mockElectronAPI.fileExists.mockReset();
            for (let i = 0; i < numConflicts; i++) {
              mockElectronAPI.fileExists.mockResolvedValueOnce({ success: true, exists: true });
            }
            mockElectronAPI.fileExists.mockResolvedValue({ success: true, exists: false });
            
            const result = await fsManager.getUniqueFilename(testDesktopPath, filename);
            
            // Extract extension and base name
            const lastDot = filename.lastIndexOf('.');
            const hasExtension = lastDot > 0 && lastDot < filename.length - 1;
            const ext = hasExtension ? filename.substring(lastDot) : '';
            const nameWithoutExt = hasExtension ? filename.substring(0, lastDot) : filename;
            
            if (numConflicts === 0) {
              // Property 1: No conflict means original filename is returned
              expect(result).toBe(filename);
            } else {
              // Property 2: With conflicts, result should have numeric suffix
              const expectedSuffix = `(${numConflicts})`;
              const expectedFilename = `${nameWithoutExt}${expectedSuffix}${ext}`;
              expect(result).toBe(expectedFilename);
              
              // Property 3: Result should contain the numeric suffix pattern
              expect(result).toMatch(/\(\d+\)/);
              
              // Property 4: Result should preserve the original extension
              if (hasExtension) {
                expect(result.endsWith(ext)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
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

    // Feature: bilibili-downloader-win7, Property 10: Download saves to desktop
    // For any successfully downloaded video, the file path should start with the Windows desktop directory path 
    // and end with a valid filename.
    // Validates: Requirements 4.4, 8.4
    it('should save any file to desktop directory with valid filename', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random filenames with various characters and extensions
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 100 })
              .filter(s => s.trim().length > 0),
            fc.constantFrom('.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv')
          ).map(([name, ext]) => name + ext),
          // Generate random video data (small buffers for testing)
          fc.uint8Array({ minLength: 10, maxLength: 1000 }),
          async (filename, dataArray) => {
            // Reset mocks for each iteration
            mockElectronAPI.fileExists.mockReset();
            mockElectronAPI.saveFile.mockReset();
            mockElectronAPI.getDesktopPath.mockReset();
            
            // Setup mocks
            mockElectronAPI.getDesktopPath.mockResolvedValue({
              success: true,
              path: testDesktopPath
            });
            
            mockElectronAPI.fileExists.mockResolvedValue({
              success: true,
              exists: false
            });
            
            mockElectronAPI.saveFile.mockResolvedValue({
              success: true
            });
            
            const data = Buffer.from(dataArray);
            const result = await fsManager.saveFile(filename, data);
            
            // Property 1: File path should start with desktop directory path
            expect(result.startsWith(testDesktopPath)).toBe(true);
            
            // Property 2: File path should end with a valid filename (no path separators in filename part)
            const pathParts = result.split('\\');
            const savedFilename = pathParts[pathParts.length - 1];
            expect(savedFilename.length).toBeGreaterThan(0);
            expect(savedFilename).not.toContain('/');
            expect(savedFilename).not.toContain('\\');
            
            // Property 3: Saved filename should not contain Windows-invalid characters
            const invalidChars = /[<>:"/\\|?*]/;
            expect(savedFilename).not.toMatch(invalidChars);
            
            // Property 4: File path should be a valid absolute Windows path
            expect(result).toMatch(/^[A-Za-z]:\\/); // Starts with drive letter
            
            // Property 5: saveFile IPC should have been called with the constructed path
            expect(mockElectronAPI.saveFile).toHaveBeenCalledWith(
              result,
              data
            );
          }
        ),
        { numRuns: 100 }
      );
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

    // Feature: bilibili-downloader-win7, Property 21: Disk space validation
    // For any download request, if available disk space is less than 100MB, 
    // the download should be prevented and the user should be notified before any download attempt.
    // Validates: Requirements 9.3
    it('should return false when disk space is less than required bytes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate required bytes between 1MB and 500MB
          fc.integer({ min: 1 * 1024 * 1024, max: 500 * 1024 * 1024 }),
          async (requiredBytes) => {
            const availableSpace = Math.floor(requiredBytes * 0.9); // 90% of required
            
            // Mock the IPC to return insufficient space
            mockElectronAPI.checkDiskSpace.mockResolvedValue({
              success: true,
              hasSpace: false,
              availableSpace: availableSpace
            });
            
            const result = await fsManager.checkDiskSpace(requiredBytes);
            
            // Property: When available space < required bytes, should return false
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: bilibili-downloader-win7, Property 21: Disk space validation
    // For any download request, if available disk space is greater than or equal to 100MB,
    // the download should be allowed to proceed.
    // Validates: Requirements 9.3
    it('should return true when disk space is sufficient', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate required bytes between 1MB and 500MB
          fc.integer({ min: 1 * 1024 * 1024, max: 500 * 1024 * 1024 }),
          async (requiredBytes) => {
            const availableSpace = Math.floor(requiredBytes * 1.5); // 150% of required
            
            // Mock the IPC to return sufficient space
            mockElectronAPI.checkDiskSpace.mockResolvedValue({
              success: true,
              hasSpace: true,
              availableSpace: availableSpace
            });
            
            const result = await fsManager.checkDiskSpace(requiredBytes);
            
            // Property: When available space >= required bytes, should return true
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: bilibili-downloader-win7, Property 21: Disk space validation
    // The default required space should be 100MB
    // Validates: Requirements 9.3
    it('should use 100MB as default required space', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (hasSpace) => {
            // Mock the IPC response
            mockElectronAPI.checkDiskSpace.mockResolvedValue({
              success: true,
              hasSpace: hasSpace
            });
            
            // Call without arguments to use default
            await fsManager.checkDiskSpace();
            
            // Property: Should call IPC with 100MB (100 * 1024 * 1024 bytes)
            expect(mockElectronAPI.checkDiskSpace).toHaveBeenCalledWith(
              expect.any(String),
              100 * 1024 * 1024
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

