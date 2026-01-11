/**
 * SettingsService - Manages application settings including download directory
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { StorageManager } from './StorageManager';
import { DirectorySelector } from './DirectorySelector';
import { FileSystemManager } from './FileSystemManager';

/**
 * Service for managing application settings
 * 
 * Requirements:
 * - 10.1: Use Windows desktop directory as default download location
 * - 10.2: Open native folder selection dialog when user clicks directory selection button
 * - 10.3: Update download location to selected directory
 * - 10.4: Maintain current download location unchanged when user cancels dialog
 * - 10.5: Revert to desktop directory when selected directory becomes unavailable
 */
export class SettingsService {
  private static readonly DOWNLOAD_DIR_KEY = 'downloadDirectory';
  
  private storageManager: StorageManager;
  private directorySelector: DirectorySelector;
  private fileSystemManager: FileSystemManager;
  private currentDownloadDirectory: string | null = null;
  private defaultDirectory: string | null = null;

  constructor(
    storageManager: StorageManager,
    directorySelector: DirectorySelector,
    fileSystemManager: FileSystemManager
  ) {
    this.storageManager = storageManager;
    this.directorySelector = directorySelector;
    this.fileSystemManager = fileSystemManager;
  }

  /**
   * Initialize the settings service
   * Loads saved settings and sets up default directory
   * Requirements: 10.1, 10.7
   */
  async initialize(): Promise<void> {
    // Get desktop path as default
    try {
      this.defaultDirectory = await this.fileSystemManager.getDesktopPath();
    } catch (error) {
      console.error('Failed to get desktop path:', error);
      // Fallback to a reasonable default if desktop path fails
      this.defaultDirectory = null;
    }

    // Load saved download directory from storage
    const savedDirectory = this.storageManager.get(SettingsService.DOWNLOAD_DIR_KEY);
    
    if (savedDirectory) {
      // Validate the saved directory
      const isValid = await this.validateDirectory(savedDirectory);
      if (isValid) {
        this.currentDownloadDirectory = savedDirectory;
      } else {
        // Requirements: 10.5 - Revert to desktop if saved directory is unavailable
        console.warn('Saved directory is no longer valid, reverting to desktop');
        this.currentDownloadDirectory = this.defaultDirectory;
        // Update storage to reflect the fallback
        if (this.defaultDirectory) {
          this.storageManager.set(SettingsService.DOWNLOAD_DIR_KEY, this.defaultDirectory);
        }
      }
    } else {
      // Requirements: 10.1 - Use desktop as default on first run
      this.currentDownloadDirectory = this.defaultDirectory;
      // Save default to storage
      if (this.defaultDirectory) {
        this.storageManager.set(SettingsService.DOWNLOAD_DIR_KEY, this.defaultDirectory);
      }
    }
  }

  /**
   * Get the current download directory
   * Requirements: 10.1, 10.6
   * @returns The current download directory path
   */
  getDownloadDirectory(): string {
    // If not initialized or no directory set, return default
    if (!this.currentDownloadDirectory) {
      return this.defaultDirectory || '';
    }
    return this.currentDownloadDirectory;
  }

  /**
   * Set the download directory
   * Requirements: 10.3, 10.7
   * @param path - The new download directory path
   */
  async setDownloadDirectory(path: string): Promise<void> {
    // Validate the directory before setting
    const isValid = await this.validateDirectory(path);
    
    if (!isValid) {
      throw new Error('Invalid directory: directory does not exist or is not writable');
    }

    this.currentDownloadDirectory = path;
    
    // Requirements: 10.7 - Persist the setting
    this.storageManager.set(SettingsService.DOWNLOAD_DIR_KEY, path);
  }

  /**
   * Open directory selection dialog and update download directory if user selects one
   * Requirements: 10.2, 10.3, 10.4
   * @returns The selected directory path, or null if cancelled
   */
  async selectDirectory(): Promise<string | null> {
    try {
      // Requirements: 10.2 - Open native folder selection dialog
      const currentDir = this.getDownloadDirectory();
      const selectedPath = await this.directorySelector.openDialog(currentDir);
      
      // Requirements: 10.4 - Maintain current location if user cancels
      if (selectedPath === null) {
        return null;
      }

      // Requirements: 10.3 - Update download location to selected directory
      await this.setDownloadDirectory(selectedPath);
      
      return selectedPath;
    } catch (error) {
      console.error('Failed to select directory:', error);
      throw error;
    }
  }

  /**
   * Validate if a directory exists and is writable
   * Requirements: 10.5
   * @param path - The directory path to validate
   * @returns True if the directory is valid and writable
   */
  async validateDirectory(path: string): Promise<boolean> {
    try {
      // Use Electron IPC if available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.validateDirectory(path);
        
        if (!result.success) {
          console.error('Directory validation failed:', result.error);
          return false;
        }
        
        return result.valid || false;
      }
      
      // Fallback for non-Electron environments (testing)
      // In testing, we can't actually validate directories
      return true;
    } catch (error) {
      console.error('Error validating directory:', error);
      return false;
    }
  }

  /**
   * Reset download directory to default (desktop)
   * Requirements: 10.5
   */
  async resetToDefault(): Promise<void> {
    if (!this.defaultDirectory) {
      throw new Error('Default directory not available');
    }

    this.currentDownloadDirectory = this.defaultDirectory;
    this.storageManager.set(SettingsService.DOWNLOAD_DIR_KEY, this.defaultDirectory);
  }

  /**
   * Get the default download directory (desktop)
   * @returns The default directory path
   */
  getDefaultDirectory(): string {
    return this.defaultDirectory || '';
  }
}
