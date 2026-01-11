/**
 * StorageManager - Handles persistent storage of application settings
 * Requirements: 10.7
 */

/**
 * Manages persistent storage of application settings using localStorage
 * 
 * Requirements:
 * - 10.7: Persist selected download directory across application restarts
 */
export class StorageManager {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Retrieve a setting value from storage
   * Requirements: 10.7
   * @param key - The setting key
   * @returns The setting value, or null if not found
   */
  get(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error(`Failed to get setting "${key}":`, error);
      return null;
    }
  }

  /**
   * Save a setting value to storage
   * Requirements: 10.7
   * @param key - The setting key
   * @param value - The setting value
   */
  set(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set setting "${key}":`, error);
      // Handle storage quota exceeded or other errors gracefully
      // In production, might want to notify user or clear old data
    }
  }

  /**
   * Remove a setting from storage
   * @param key - The setting key to remove
   */
  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove setting "${key}":`, error);
    }
  }

  /**
   * Clear all settings from storage
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
