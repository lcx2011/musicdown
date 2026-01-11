/**
 * Tests for DirectorySelector
 */

import { DirectorySelector } from './DirectorySelector';

// Mock Electron API
const mockElectronAPI = {
  selectDirectory: jest.fn(),
};

describe('DirectorySelector', () => {
  let directorySelector: DirectorySelector;

  beforeEach(() => {
    directorySelector = new DirectorySelector();
    
    // Mock window.electronAPI in jsdom environment
    Object.defineProperty(window, 'electronAPI', {
      writable: true,
      configurable: true,
      value: mockElectronAPI,
    });
  });

  afterEach(() => {
    // Clean up mocks
    delete (window as any).electronAPI;
    jest.clearAllMocks();
  });

  describe('openDialog', () => {
    it('should return selected directory path', async () => {
      const testPath = 'C:\\Users\\Test\\Downloads';
      mockElectronAPI.selectDirectory.mockResolvedValue({
        success: true,
        canceled: false,
        path: testPath,
      });

      const result = await directorySelector.openDialog();
      
      expect(result).toBe(testPath);
      expect(mockElectronAPI.selectDirectory).toHaveBeenCalledWith(undefined);
    });

    it('should return null when user cancels', async () => {
      mockElectronAPI.selectDirectory.mockResolvedValue({
        success: true,
        canceled: true,
        path: null,
      });

      const result = await directorySelector.openDialog();
      
      expect(result).toBeNull();
    });

    it('should pass default path to dialog', async () => {
      const defaultPath = 'C:\\Users\\Test\\Desktop';
      mockElectronAPI.selectDirectory.mockResolvedValue({
        success: true,
        canceled: true,
        path: null,
      });

      await directorySelector.openDialog(defaultPath);
      
      expect(mockElectronAPI.selectDirectory).toHaveBeenCalledWith(defaultPath);
    });

    it('should throw error when IPC fails', async () => {
      mockElectronAPI.selectDirectory.mockResolvedValue({
        success: false,
        error: 'Dialog error',
      });

      await expect(directorySelector.openDialog()).rejects.toThrow('Failed to open directory dialog: Dialog error');
    });

    it('should throw error when electronAPI is not available', async () => {
      delete (window as any).electronAPI;

      await expect(directorySelector.openDialog()).rejects.toThrow('Directory selection not available in this environment');
    });

    it('should handle empty path result', async () => {
      mockElectronAPI.selectDirectory.mockResolvedValue({
        success: true,
        canceled: false,
        path: '',
      });

      const result = await directorySelector.openDialog();
      
      expect(result).toBeNull();
    });
  });
});
