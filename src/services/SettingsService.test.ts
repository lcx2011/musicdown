/**
 * Tests for SettingsService
 */

import { SettingsService } from './SettingsService';
import { StorageManager } from './StorageManager';
import { DirectorySelector } from './DirectorySelector';
import { FileSystemManager } from './FileSystemManager';
import * as fc from 'fast-check';

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockStorageManager: jest.Mocked<StorageManager>;
  let mockDirectorySelector: jest.Mocked<DirectorySelector>;
  let mockFileSystemManager: jest.Mocked<FileSystemManager>;
  let mockElectronAPI: any;

  const testDesktopPath = 'C:\\Users\\Test\\Desktop';
  const testCustomPath = 'C:\\Users\\Test\\Downloads';

  beforeEach(() => {
    // Create mocks
    mockStorageManager = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    } as any;

    mockDirectorySelector = {
      openDialog: jest.fn(),
    } as any;

    mockFileSystemManager = {
      getDesktopPath: jest.fn().mockResolvedValue(testDesktopPath),
    } as any;

    // Mock Electron API
    mockElectronAPI = {
      validateDirectory: jest.fn(),
    };

    Object.defineProperty(window, 'electronAPI', {
      writable: true,
      configurable: true,
      value: mockElectronAPI,
    });

    settingsService = new SettingsService(
      mockStorageManager,
      mockDirectorySelector,
      mockFileSystemManager
    );
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should use desktop as default on first run', async () => {
      mockStorageManager.get.mockReturnValue(null);

      await settingsService.initialize();

      expect(mockFileSystemManager.getDesktopPath).toHaveBeenCalled();
      expect(settingsService.getDownloadDirectory()).toBe(testDesktopPath);
      expect(mockStorageManager.set).toHaveBeenCalledWith('downloadDirectory', testDesktopPath);
    });

    it('should load saved directory if valid', async () => {
      mockStorageManager.get.mockReturnValue(testCustomPath);
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });

      await settingsService.initialize();

      expect(settingsService.getDownloadDirectory()).toBe(testCustomPath);
    });

    it('should revert to desktop if saved directory is invalid', async () => {
      mockStorageManager.get.mockReturnValue(testCustomPath);
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: false,
        reason: 'Directory does not exist',
      });

      await settingsService.initialize();

      expect(settingsService.getDownloadDirectory()).toBe(testDesktopPath);
      expect(mockStorageManager.set).toHaveBeenCalledWith('downloadDirectory', testDesktopPath);
    });

    it('should handle desktop path failure gracefully', async () => {
      mockFileSystemManager.getDesktopPath.mockRejectedValue(new Error('Failed to get desktop'));
      mockStorageManager.get.mockReturnValue(null);

      await settingsService.initialize();

      expect(settingsService.getDownloadDirectory()).toBe('');
    });
  });

  describe('getDownloadDirectory', () => {
    it('should return current download directory', async () => {
      mockStorageManager.get.mockReturnValue(testCustomPath);
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });

      await settingsService.initialize();

      expect(settingsService.getDownloadDirectory()).toBe(testCustomPath);
    });

    it('should return default if not initialized', () => {
      const result = settingsService.getDownloadDirectory();
      expect(result).toBe('');
    });
  });

  describe('setDownloadDirectory', () => {
    beforeEach(async () => {
      mockStorageManager.get.mockReturnValue(null);
      await settingsService.initialize();
    });

    it('should update download directory if valid', async () => {
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });

      await settingsService.setDownloadDirectory(testCustomPath);

      expect(settingsService.getDownloadDirectory()).toBe(testCustomPath);
      expect(mockStorageManager.set).toHaveBeenCalledWith('downloadDirectory', testCustomPath);
    });

    it('should throw error if directory is invalid', async () => {
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: false,
        reason: 'Directory does not exist',
      });

      await expect(settingsService.setDownloadDirectory(testCustomPath)).rejects.toThrow(
        'Invalid directory: directory does not exist or is not writable'
      );
    });
  });

  describe('selectDirectory', () => {
    beforeEach(async () => {
      mockStorageManager.get.mockReturnValue(null);
      await settingsService.initialize();
    });

    it('should open dialog and update directory on selection', async () => {
      mockDirectorySelector.openDialog.mockResolvedValue(testCustomPath);
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });

      const result = await settingsService.selectDirectory();

      expect(mockDirectorySelector.openDialog).toHaveBeenCalledWith(testDesktopPath);
      expect(result).toBe(testCustomPath);
      expect(settingsService.getDownloadDirectory()).toBe(testCustomPath);
    });

    it('should return null and not update directory when user cancels', async () => {
      mockDirectorySelector.openDialog.mockResolvedValue(null);

      const result = await settingsService.selectDirectory();

      expect(result).toBeNull();
      expect(settingsService.getDownloadDirectory()).toBe(testDesktopPath);
      // Should not call set when cancelled
      expect(mockStorageManager.set).toHaveBeenCalledTimes(1); // Only the initial set
    });

    it('should throw error if dialog fails', async () => {
      mockDirectorySelector.openDialog.mockRejectedValue(new Error('Dialog failed'));

      await expect(settingsService.selectDirectory()).rejects.toThrow('Dialog failed');
    });
  });

  describe('validateDirectory', () => {
    it('should return true for valid directory', async () => {
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });

      const result = await settingsService.validateDirectory(testCustomPath);

      expect(result).toBe(true);
      expect(mockElectronAPI.validateDirectory).toHaveBeenCalledWith(testCustomPath);
    });

    it('should return false for invalid directory', async () => {
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: false,
        reason: 'Directory does not exist',
      });

      const result = await settingsService.validateDirectory(testCustomPath);

      expect(result).toBe(false);
    });

    it('should return false on IPC error', async () => {
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: false,
        error: 'IPC error',
      });

      const result = await settingsService.validateDirectory(testCustomPath);

      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      mockElectronAPI.validateDirectory.mockRejectedValue(new Error('Validation error'));

      const result = await settingsService.validateDirectory(testCustomPath);

      expect(result).toBe(false);
    });
  });

  describe('resetToDefault', () => {
    beforeEach(async () => {
      mockStorageManager.get.mockReturnValue(testCustomPath);
      mockElectronAPI.validateDirectory.mockResolvedValue({
        success: true,
        valid: true,
      });
      await settingsService.initialize();
    });

    it('should reset to desktop directory', async () => {
      await settingsService.resetToDefault();

      expect(settingsService.getDownloadDirectory()).toBe(testDesktopPath);
      expect(mockStorageManager.set).toHaveBeenCalledWith('downloadDirectory', testDesktopPath);
    });

    it('should throw error if default directory not available', async () => {
      mockFileSystemManager.getDesktopPath.mockRejectedValue(new Error('Failed'));
      const service = new SettingsService(
        mockStorageManager,
        mockDirectorySelector,
        mockFileSystemManager
      );
      mockStorageManager.get.mockReturnValue(null);
      await service.initialize();

      await expect(service.resetToDefault()).rejects.toThrow('Default directory not available');
    });
  });

  describe('getDefaultDirectory', () => {
    it('should return desktop path', async () => {
      mockStorageManager.get.mockReturnValue(null);
      await settingsService.initialize();

      expect(settingsService.getDefaultDirectory()).toBe(testDesktopPath);
    });

    it('should return empty string if not initialized', () => {
      expect(settingsService.getDefaultDirectory()).toBe('');
    });
  });

  // Property-Based Tests
  describe('Property-Based Tests', () => {
    // Feature: bilibili-downloader-win7, Property 23: Directory selection dialog trigger
    // Validates: Requirements 10.2
    describe('Property 23: Directory selection dialog trigger', () => {
      it('should always trigger directory selection dialog when selectDirectory is called', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(testDesktopPath, testCustomPath, 'C:\\Users\\Test\\Videos'),
            async (currentDir) => {
              // Setup
              mockStorageManager.get.mockReturnValue(currentDir);
              mockElectronAPI.validateDirectory.mockResolvedValue({
                success: true,
                valid: true,
              });
              
              const service = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );
              await service.initialize();

              // Reset mock to track this specific call
              mockDirectorySelector.openDialog.mockClear();
              mockDirectorySelector.openDialog.mockResolvedValue(null);

              // Act
              await service.selectDirectory();

              // Assert: Dialog should always be opened
              expect(mockDirectorySelector.openDialog).toHaveBeenCalledTimes(1);
              expect(mockDirectorySelector.openDialog).toHaveBeenCalledWith(currentDir);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // Feature: bilibili-downloader-win7, Property 24: Directory update on selection
    // Validates: Requirements 10.3
    describe('Property 24: Directory update on selection', () => {
      it('should always update download directory when valid path is selected', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('\0')),
            async (selectedPath) => {
              // Setup
              mockStorageManager.get.mockReturnValue(null);
              mockElectronAPI.validateDirectory.mockResolvedValue({
                success: true,
                valid: true,
              });
              
              const service = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );
              await service.initialize();

              const initialDir = service.getDownloadDirectory();
              
              // Mock dialog to return selected path
              mockDirectorySelector.openDialog.mockResolvedValue(selectedPath);

              // Act
              const result = await service.selectDirectory();

              // Assert: Directory should be updated to selected path
              expect(result).toBe(selectedPath);
              expect(service.getDownloadDirectory()).toBe(selectedPath);
              expect(service.getDownloadDirectory()).not.toBe(initialDir);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // Feature: bilibili-downloader-win7, Property 25: Directory unchanged on cancel
    // Validates: Requirements 10.4
    describe('Property 25: Directory unchanged on cancel', () => {
      it('should never change directory when user cancels dialog', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(testDesktopPath, testCustomPath, 'C:\\Users\\Test\\Videos'),
            async (initialDir) => {
              // Setup
              mockStorageManager.get.mockReturnValue(initialDir);
              mockElectronAPI.validateDirectory.mockResolvedValue({
                success: true,
                valid: true,
              });
              
              const service = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );
              await service.initialize();

              const dirBeforeCancel = service.getDownloadDirectory();
              
              // Mock dialog to return null (cancelled)
              mockDirectorySelector.openDialog.mockResolvedValue(null);

              // Act
              const result = await service.selectDirectory();

              // Assert: Directory should remain unchanged
              expect(result).toBeNull();
              expect(service.getDownloadDirectory()).toBe(dirBeforeCancel);
              expect(service.getDownloadDirectory()).toBe(initialDir);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // Feature: bilibili-downloader-win7, Property 26: Directory fallback on unavailability
    // Validates: Requirements 10.5
    describe('Property 26: Directory fallback on unavailability', () => {
      it('should always revert to desktop when configured directory becomes unavailable', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('\0')),
            async (invalidDir) => {
              // Setup: Start with an invalid saved directory
              mockStorageManager.get.mockReturnValue(invalidDir);
              mockElectronAPI.validateDirectory.mockImplementation(async (path: string) => {
                // Desktop is valid, saved directory is not
                if (path === testDesktopPath) {
                  return { success: true, valid: true };
                }
                return { success: true, valid: false, reason: 'Directory does not exist' };
              });
              
              const service = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );

              // Act: Initialize should detect invalid directory and fallback
              await service.initialize();

              // Assert: Should fallback to desktop
              expect(service.getDownloadDirectory()).toBe(testDesktopPath);
              expect(service.getDownloadDirectory()).not.toBe(invalidDir);
              // Should persist the fallback
              expect(mockStorageManager.set).toHaveBeenCalledWith('downloadDirectory', testDesktopPath);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // Feature: bilibili-downloader-win7, Property 28: Settings persistence round-trip
    // Validates: Requirements 10.7
    describe('Property 28: Settings persistence round-trip', () => {
      it('should persist and restore any valid directory path across restarts', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('\0')),
            async (directoryPath) => {
              // Setup: First service instance sets directory
              mockStorageManager.get.mockReturnValue(null);
              mockElectronAPI.validateDirectory.mockResolvedValue({
                success: true,
                valid: true,
              });
              
              const service1 = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );
              await service1.initialize();

              // Act: Set directory
              await service1.setDownloadDirectory(directoryPath);

              // Capture what was saved
              const savedValue = mockStorageManager.set.mock.calls.find(
                call => call[0] === 'downloadDirectory' && call[1] === directoryPath
              )?.[1];

              // Simulate app restart: Create new service instance
              mockStorageManager.get.mockReturnValue(savedValue);
              
              const service2 = new SettingsService(
                mockStorageManager,
                mockDirectorySelector,
                mockFileSystemManager
              );
              await service2.initialize();

              // Assert: Directory should be restored
              expect(service2.getDownloadDirectory()).toBe(directoryPath);
              expect(service2.getDownloadDirectory()).toBe(savedValue);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
