/// <reference types="vite/client" />

/**
 * Electron API types exposed via preload script
 */
export interface ElectronAPI {
  extractVideo: (videoUrl: string) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
    statusCode?: number;
  }>;
  getDesktopPath: () => Promise<{ success: boolean; path?: string; error?: string }>;
  saveFile: (filepath: string, data: Buffer) => Promise<{ success: boolean; path?: string; error?: string }>;
  checkDiskSpace: (path: string, requiredBytes: number) => Promise<{ 
    success: boolean; 
    hasSpace?: boolean; 
    availableBytes?: number;
    requiredBytes?: number;
    error?: string 
  }>;
  fileExists: (filepath: string) => Promise<{ 
    success: boolean; 
    exists: boolean;
    error?: string 
  }>;
  downloadVideo: (url: string, onProgress?: boolean) => Promise<{
    success: boolean;
    data?: ArrayBuffer;
    size?: number;
    error?: string;
    statusCode?: number;
  }>;
  onDownloadProgress: (callback: (progress: { url: string; loaded: number; total: number; percentage: number }) => void) => void;
  selectDirectory: (defaultPath?: string) => Promise<{ 
    success: boolean; 
    path?: string;
    canceled?: boolean;
    error?: string 
  }>;
  validateDirectory: (path: string) => Promise<{ 
    success: boolean; 
    isValid?: boolean; 
    error?: string 
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
