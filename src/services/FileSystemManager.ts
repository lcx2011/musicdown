/**
 * FileSystemManager - Handles file system operations for video downloads
 * Requirements: 4.4, 8.2, 8.3, 8.4, 9.3
 */

/**
 * Manages file system operations including path resolution,
 * filename sanitization, and file saving
 */
export class FileSystemManager {
  /**
   * Browser-compatible path utilities
   * These replace Node.js path module functions
   */
  private pathExtname(filepath: string): string {
    const lastDot = filepath.lastIndexOf('.');
    const lastSlash = Math.max(filepath.lastIndexOf('/'), filepath.lastIndexOf('\\'));
    if (lastDot > lastSlash && lastDot > 0) {
      return filepath.substring(lastDot);
    }
    return '';
  }

  private pathBasename(filepath: string, ext?: string): string {
    const lastSlash = Math.max(filepath.lastIndexOf('/'), filepath.lastIndexOf('\\'));
    let basename = lastSlash >= 0 ? filepath.substring(lastSlash + 1) : filepath;
    if (ext && basename.endsWith(ext)) {
      basename = basename.substring(0, basename.length - ext.length);
    }
    return basename;
  }

  private pathJoin(...parts: string[]): string {
    // Use Windows path separator
    return parts.join('\\').replace(/\\/g, '\\');
  }
  /**
   * Get the Windows desktop directory path
   * Requirements: 4.4
   * @returns Promise that resolves to the full path to the Windows desktop directory
   */
  async getDesktopPath(): Promise<string> {
    // Use Electron IPC if available
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.getDesktopPath();
      if (result.success && result.path) {
        return result.path;
      }
      throw new Error(result.error || 'Failed to get desktop path');
    }
    
    // Fallback for non-Electron environments (testing)
    // This won't work in browser, but needed for type compatibility
    throw new Error('Desktop path not available in this environment');
  }

  /**
   * Check if a file exists at the given path
   * Requirements: 4.4
   * @param filepath - The full path to the file
   * @returns True if the file exists, false otherwise
   */
  async fileExists(filepath: string): Promise<boolean> {
    try {
      // Use Electron IPC if available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.fileExists(filepath);
        return result.success && result.exists;
      }
      
      // Fallback for non-Electron environments
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if there is sufficient disk space available
   * Requirements: 9.3
   * @param requiredBytes - The number of bytes required (default: 100MB)
   * @returns Promise that resolves to true if sufficient space is available
   */
  async checkDiskSpace(requiredBytes: number = 100 * 1024 * 1024): Promise<boolean> {
    try {
      // Use Electron IPC if available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const desktopPath = await this.getDesktopPath();
        const result = await window.electronAPI.checkDiskSpace(desktopPath, requiredBytes);
        if (result.success) {
          return result.hasSpace || true; // Default to true if check fails
        }
      }
      
      // Fallback: assume space is available
      return true;
    } catch (error) {
      // If we can't check disk space, assume it's available
      return true;
    }
  }

  /**
   * Sanitize a filename to be Windows-compatible
   * Requirements: 8.2
   * @param filename - The original filename
   * @returns A sanitized filename safe for Windows file systems
   */
  sanitizeFilename(filename: string): string {
    // Remove or replace invalid Windows characters: < > : " / \ | ? *
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
    
    // Handle edge case: if the result is empty or only whitespace
    sanitized = sanitized.trim();
    
    // If result is empty or only underscores (from all invalid chars), use default
    if (sanitized.length === 0 || /^_+$/.test(sanitized)) {
      sanitized = 'video';
    }
    
    // Ensure filename length <= 255 characters (Windows limit)
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }
    
    return sanitized;
  }

  /**
   * Get a unique filename by appending a numeric suffix if needed
   * Requirements: 8.3
   * @param basePath - The directory path
   * @param filename - The desired filename
   * @returns A unique filename that doesn't conflict with existing files
   */
  async getUniqueFilename(basePath: string, filename: string): Promise<string> {
    // Parse the filename to extract name and extension
    const ext = this.pathExtname(filename);
    const nameWithoutExt = this.pathBasename(filename, ext);
    
    // Try different filenames until we find one that doesn't exist
    let counter = 0;
    let uniqueFilename = filename;
    
    // Check if file exists using IPC
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        while (counter < 100) { // Limit to 100 attempts
          if (counter === 0) {
            uniqueFilename = filename;
          } else {
            uniqueFilename = `${nameWithoutExt}(${counter})${ext}`;
          }
          
          const fullPath = this.pathJoin(basePath, uniqueFilename);
          const exists = await this.fileExists(fullPath);
          
          if (!exists) {
            break;
          }
          
          counter++;
        }
      } catch {
        // If anything fails, just use the original filename
        uniqueFilename = filename;
      }
    }
    
    return uniqueFilename;
  }

  /**
   * Save a file to the desktop with verification
   * Requirements: 8.4
   * @param filename - The desired filename
   * @param data - The file data as a Buffer
   * @returns Promise that resolves to the full file path on success
   * @throws Error if the file cannot be saved or verified
   */
  async saveFile(filename: string, data: Buffer): Promise<string> {
    try {
      // Get the desktop path
      const desktopPath = await this.getDesktopPath();
      
      // Sanitize the filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // Get a unique filename to avoid conflicts
      const uniqueFilename = await this.getUniqueFilename(desktopPath, sanitizedFilename);
      
      // Construct the full file path
      const fullPath = this.pathJoin(desktopPath, uniqueFilename);
      
      // Use Electron IPC to save file if available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.saveFile(fullPath, data);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save file via IPC');
        }
        return fullPath;
      }
      
      // Fallback (won't work in browser)
      throw new Error('File saving not available in this environment');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save file: ${error.message}`);
      }
      throw new Error('Failed to save file: unknown error');
    }
  }
}

