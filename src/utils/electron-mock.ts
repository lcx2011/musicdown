/**
 * Mock for Electron module in browser/Vite dev environment
 */

// Check if we're in a real Electron environment
const isElectron = typeof window !== 'undefined' && (window as any).require;

let electronModule: any = null;

if (isElectron) {
  try {
    electronModule = (window as any).require('electron');
  } catch (error) {
    console.warn('Failed to load electron module:', error);
  }
}

// Export shell with fallback
export const shell = electronModule?.shell || {
  openExternal: async (url: string) => {
    console.log('Mock shell.openExternal:', url);
    window.open(url, '_blank');
  },
};

// Export other commonly used Electron APIs
export const ipcRenderer = electronModule?.ipcRenderer || {
  send: () => {},
  on: () => {},
  invoke: async () => {},
};

export const remote = electronModule?.remote || {};

export default electronModule || { shell, ipcRenderer, remote };
