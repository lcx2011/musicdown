/**
 * Cleanup Service for application exit
 * Requirements: 6.4
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Service for cleaning up temporary files and resources on application exit
 * 
 * Requirements:
 * - 6.4: Remove temporary files and clear cache on exit
 */
export class CleanupService {
  private tempFiles: Set<string>;
  private tempDirectories: Set<string>;
  private cleanupHandlers: Array<() => void | Promise<void>>;

  constructor() {
    this.tempFiles = new Set();
    this.tempDirectories = new Set();
    this.cleanupHandlers = [];
  }

  /**
   * Register a temporary file for cleanup
   * 
   * @param filePath - Path to temporary file
   */
  registerTempFile(filePath: string): void {
    this.tempFiles.add(filePath);
  }

  /**
   * Register a temporary directory for cleanup
   * 
   * @param dirPath - Path to temporary directory
   */
  registerTempDirectory(dirPath: string): void {
    this.tempDirectories.add(dirPath);
  }

  /**
   * Register a custom cleanup handler
   * 
   * @param handler - Function to execute during cleanup
   */
  registerCleanupHandler(handler: () => void | Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Remove a temporary file from the filesystem
   * 
   * @param filePath - Path to file to remove
   */
  private async removeTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to remove temp file ${filePath}:`, error);
    }
  }

  /**
   * Remove a temporary directory from the filesystem
   * 
   * @param dirPath - Path to directory to remove
   */
  private async removeTempDirectory(dirPath: string): Promise<void> {
    try {
      if (fs.existsSync(dirPath)) {
        await fs.promises.rm(dirPath, { recursive: true, force: true });
        console.log(`Cleaned up temp directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Failed to remove temp directory ${dirPath}:`, error);
    }
  }

  /**
   * Execute all cleanup operations
   * 
   * Requirements: 6.4
   * - Remove temporary files on exit
   * - Clear download cache
   * 
   * @returns Promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    console.log('Starting application cleanup...');

    // Execute custom cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (error) {
        console.error('Error in cleanup handler:', error);
      }
    }

    // Remove temporary files
    const filePromises = Array.from(this.tempFiles).map(file => 
      this.removeTempFile(file)
    );
    await Promise.all(filePromises);

    // Remove temporary directories
    const dirPromises = Array.from(this.tempDirectories).map(dir => 
      this.removeTempDirectory(dir)
    );
    await Promise.all(dirPromises);

    // Clear the sets
    this.tempFiles.clear();
    this.tempDirectories.clear();
    this.cleanupHandlers = [];

    console.log('Application cleanup complete');
  }

  /**
   * Get the application's temporary directory
   * 
   * @returns Path to temp directory
   */
  getTempDirectory(): string {
    const appTempDir = path.join(os.tmpdir(), 'bilibili-downloader');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(appTempDir)) {
      fs.mkdirSync(appTempDir, { recursive: true });
    }

    return appTempDir;
  }

  /**
   * Create a temporary file path
   * 
   * @param filename - Name of the temporary file
   * @returns Full path to temporary file
   */
  createTempFilePath(filename: string): string {
    const tempDir = this.getTempDirectory();
    const filePath = path.join(tempDir, filename);
    this.registerTempFile(filePath);
    return filePath;
  }
}

/**
 * Global cleanup service instance
 */
let cleanupServiceInstance: CleanupService | null = null;

/**
 * Get or create the global cleanup service instance
 */
export function getCleanupService(): CleanupService {
  if (!cleanupServiceInstance) {
    cleanupServiceInstance = new CleanupService();
  }
  return cleanupServiceInstance;
}

/**
 * Register cleanup handlers for process exit events
 * 
 * Requirements: 6.4
 * - Register beforeunload event handler
 * - Remove temporary files on exit
 * - Clear download cache
 */
export function registerCleanupHandlers(): void {
  const cleanupService = getCleanupService();

  // Handle process exit
  process.on('exit', () => {
    // Synchronous cleanup only
    console.log('Process exiting...');
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, cleaning up...');
    await cleanupService.cleanup();
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, cleaning up...');
    await cleanupService.cleanup();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cleanupService.cleanup();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await cleanupService.cleanup();
    process.exit(1);
  });
}
