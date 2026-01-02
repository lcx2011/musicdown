/**
 * Mock for Node.js crypto module in browser/Vite dev environment
 */

// Check if we're in a real Node.js/Electron environment
const isNode = typeof window !== 'undefined' && (window as any).require;

// Try to load real crypto module if available
let cryptoModule: any = null;

if (isNode) {
  try {
    cryptoModule = (window as any).require('crypto');
  } catch (error) {
    console.warn('Failed to load crypto module:', error);
  }
}

// Create crypto mock with fallback implementation
const cryptoMock = cryptoModule || {
  createHash: (_algorithm: string) => ({
    update: function(data: string | Buffer) {
      this._data = (this._data || '') + (typeof data === 'string' ? data : data.toString());
      return this;
    },
    digest: function(_encoding: string) {
      const data = this._data || '';
      // Simple fallback hash for development
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hashStr = Math.abs(hash).toString(16).padStart(32, '0');
      return hashStr;
    },
    _data: '',
  }),
};

// Export as default to match Node.js crypto module
export default cryptoMock;
