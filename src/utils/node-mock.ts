/**
 * Mock for Node.js modules in browser/Vite dev environment
 */

// Check if we're in a real Node.js/Electron environment
const isNode = typeof window !== 'undefined' && (window as any).require;

// Try to load real Node.js modules if available
let fsModule: any = null;
let pathModule: any = null;
let osModule: any = null;
let cryptoModule: any = null;

if (isNode) {
  try {
    fsModule = (window as any).require('fs');
    pathModule = (window as any).require('path');
    osModule = (window as any).require('os');
    cryptoModule = (window as any).require('crypto');
  } catch (error) {
    console.warn('Failed to load Node.js modules:', error);
  }
}

// Export fs with fallback
export const fs = fsModule || {
  existsSync: () => false,
  promises: {
    writeFile: async () => {},
    unlink: async () => {},
    stat: async () => ({ size: 0 }),
    rm: async () => {},
  },
  mkdirSync: () => {},
  statfsSync: () => null,
};

// Export path with fallback
export const path = pathModule || {
  join: (...args: string[]) => args.join('/'),
  basename: (p: string, ext?: string) => {
    const base = p.split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  },
  extname: (p: string) => {
    const parts = p.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  },
};

// Export os with fallback
export const os = osModule || {
  homedir: () => '/home/user',
  tmpdir: () => '/tmp',
};

// Export crypto with fallback
export const crypto = cryptoModule || {
  createHash: (_algorithm: string) => ({
    update: (data: string) => ({
      digest: (_encoding: string) => {
        // Simple fallback hash for development
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      },
    }),
  }),
};

// Default exports
export default { fs, path, os, crypto };
