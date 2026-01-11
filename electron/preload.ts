// Preload script for Electron
// This file runs before the renderer process loads
// Exposes IPC channels to the renderer process as an alternative to direct Node.js access

// Note: With nodeIntegration enabled, the renderer can directly use Node.js APIs
// However, we also expose IPC methods for future migration to contextIsolation
// Requirements: 4.4, 9.3

const { ipcRenderer } = require('electron');

/**
 * Electron API object
 */
const electronAPI = {
  /**
   * Extract video information from Bilibili
   */
  extractVideo: async (videoUrl: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    statusCode?: number;
  }> => {
    return await ipcRenderer.invoke('extract-video', { videoUrl });
  },

  /**
   * Get the desktop path
   * Requirements: 4.4
   */
  getDesktopPath: async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    return await ipcRenderer.invoke('get-desktop-path');
  },

  /**
   * Save a file to disk
   * Requirements: 4.4
   */
  saveFile: async (filepath: string, data: Buffer): Promise<{ success: boolean; path?: string; error?: string }> => {
    return await ipcRenderer.invoke('save-file', { filepath, data });
  },

  /**
   * Check available disk space
   * Requirements: 9.3
   */
  checkDiskSpace: async (path: string, requiredBytes: number): Promise<{ 
    success: boolean; 
    hasSpace?: boolean; 
    availableBytes?: number;
    requiredBytes?: number;
    error?: string 
  }> => {
    return await ipcRenderer.invoke('check-disk-space', { path, requiredBytes });
  },

  /**
   * Check if a file exists
   * Requirements: 4.4
   */
  fileExists: async (filepath: string): Promise<{ 
    success: boolean; 
    exists: boolean;
    error?: string 
  }> => {
    return await ipcRenderer.invoke('file-exists', { filepath });
  },

  /**
   * Open directory selection dialog
   * Requirements: 10.2
   */
  selectDirectory: async (defaultPath?: string): Promise<{
    success: boolean;
    canceled?: boolean;
    path?: string | null;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('select-directory', { defaultPath });
  },

  /**
   * Validate if a directory exists and is writable
   * Requirements: 10.5
   */
  validateDirectory: async (dirPath: string): Promise<{
    success: boolean;
    valid?: boolean;
    reason?: string;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('validate-directory', { dirPath });
  },

  /**
   * Download video from Bilibili CDN
   * This bypasses CORS restrictions by running in the main process
   */
  downloadVideo: async (url: string, onProgress?: boolean): Promise<{
    success: boolean;
    data?: ArrayBuffer;
    size?: number;
    error?: string;
    statusCode?: number;
  }> => {
    return await ipcRenderer.invoke('download-video', { url, onProgress });
  },

  /**
   * Listen for download progress events
   */
  onDownloadProgress: (callback: (progress: { url: string; loaded: number; total: number; percentage: number }) => void) => {
    ipcRenderer.on('download-progress', (_event: any, progress: any) => callback(progress));
  },
};

// Expose API based on contextIsolation setting
if (process.contextIsolated) {
  // contextIsolation: true - use contextBridge
  const { contextBridge } = require('electron');
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} else {
  // contextIsolation: false - directly attach to window
  (window as any).electronAPI = electronAPI;
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('Bilibili Downloader - Preload script loaded');
  console.log('Context Isolation:', process.contextIsolated);
  console.log('Node Integration:', process.versions.node ? 'enabled' : 'disabled');
  console.log('electronAPI available:', typeof (window as any).electronAPI !== 'undefined');
});
