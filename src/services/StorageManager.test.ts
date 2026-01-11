/**
 * Tests for StorageManager
 */

import { StorageManager } from './StorageManager';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockStorage: Storage;

  beforeEach(() => {
    // Create a mock storage implementation
    const store: { [key: string]: string } = {};
    
    mockStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: jest.fn(() => null),
    };

    storageManager = new StorageManager(mockStorage);
  });

  describe('get', () => {
    it('should retrieve a stored value', () => {
      mockStorage.setItem('testKey', 'testValue');
      const result = storageManager.get('testKey');
      expect(result).toBe('testValue');
    });

    it('should return null for non-existent key', () => {
      const result = storageManager.get('nonExistentKey');
      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const errorStorage = {
        ...mockStorage,
        getItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
      };
      
      const manager = new StorageManager(errorStorage as Storage);
      const result = manager.get('testKey');
      
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store a value', () => {
      storageManager.set('testKey', 'testValue');
      expect(mockStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
      expect(storageManager.get('testKey')).toBe('testValue');
    });

    it('should overwrite existing value', () => {
      storageManager.set('testKey', 'value1');
      storageManager.set('testKey', 'value2');
      expect(storageManager.get('testKey')).toBe('value2');
    });

    it('should handle storage errors gracefully', () => {
      const errorStorage = {
        ...mockStorage,
        setItem: jest.fn(() => {
          throw new Error('Storage quota exceeded');
        }),
      };
      
      const manager = new StorageManager(errorStorage as Storage);
      
      // Should not throw
      expect(() => manager.set('testKey', 'testValue')).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a stored value', () => {
      storageManager.set('testKey', 'testValue');
      storageManager.remove('testKey');
      
      expect(mockStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(storageManager.get('testKey')).toBeNull();
    });

    it('should handle removing non-existent key', () => {
      expect(() => storageManager.remove('nonExistentKey')).not.toThrow();
    });

    it('should handle storage errors gracefully', () => {
      const errorStorage = {
        ...mockStorage,
        removeItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
      };
      
      const manager = new StorageManager(errorStorage as Storage);
      
      // Should not throw
      expect(() => manager.remove('testKey')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all stored values', () => {
      storageManager.set('key1', 'value1');
      storageManager.set('key2', 'value2');
      storageManager.set('key3', 'value3');
      
      storageManager.clear();
      
      expect(mockStorage.clear).toHaveBeenCalled();
      expect(storageManager.get('key1')).toBeNull();
      expect(storageManager.get('key2')).toBeNull();
      expect(storageManager.get('key3')).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const errorStorage = {
        ...mockStorage,
        clear: jest.fn(() => {
          throw new Error('Storage error');
        }),
      };
      
      const manager = new StorageManager(errorStorage as Storage);
      
      // Should not throw
      expect(() => manager.clear()).not.toThrow();
    });
  });
});
