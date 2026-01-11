/**
 * DirectorySelector - Handles directory selection using Electron dialog
 * Requirements: 10.2
 */

/**
 * Manages directory selection using Electron's native dialog
 * 
 * Requirements:
 * - 10.2: Open native folder selection dialog when user clicks directory selection button
 */
export class DirectorySelector {
  /**
   * Open a directory selection dialog
   * Requirements: 10.2
   * @param defaultPath - Optional default path to show in the dialog
   * @returns Promise that resolves to the selected directory path, or null if cancelled
   */
  async openDialog(defaultPath?: string): Promise<string | null> {
    try {
      // Use Electron IPC if available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.selectDirectory(defaultPath);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to open directory dialog');
        }
        
        // Return null if user cancelled
        if (result.canceled) {
          return null;
        }
        
        return result.path || null;
      }
      
      // Fallback for non-Electron environments (testing)
      throw new Error('Directory selection not available in this environment');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to open directory dialog: ${error.message}`);
      }
      throw new Error('Failed to open directory dialog: unknown error');
    }
  }
}
