/**
 * Main Application Component
 * Integrates SearchView, ResultsGrid, and VideoCard components
 * Requirements: 4.2, 4.6, 6.4
 */

import { useState, useEffect, useCallback } from 'react';
import { SearchView, ResultsGrid } from './components';
import { VideoMetadata, DownloadState, Video, Download } from './types';
import { useAppContext } from './context/AppContext';
import { SearchService } from './services/SearchService';
import { DownloadService } from './services/DownloadService';
import { VideoService } from './services/VideoService';
import { APIClient } from './services/APIClient';
import { FileSystemManager } from './services/FileSystemManager';
import { ErrorHandler } from './services/ErrorHandler';

// Initialize services
const apiClient = new APIClient();
const fileSystemManager = new FileSystemManager();
const searchService = new SearchService(apiClient);
const downloadService = new DownloadService(apiClient, fileSystemManager);
const videoService = new VideoService();
const errorHandler = new ErrorHandler();

function App() {
  const { state, actions } = useAppContext();
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Initialize download directory on app start
   * Requirements: 10.1
   */
  useEffect(() => {
    const initializeDownloadDirectory = async () => {
      // Only initialize if directory is not set
      if (state.settings.downloadDirectory) {
        return;
      }

      try {
        // Get desktop path as default
        if (typeof window !== 'undefined' && window.electronAPI) {
          const result = await window.electronAPI.getDesktopPath();
          if (result.success && result.path) {
            actions.setDownloadDirectory(result.path);
          }
        }
      } catch (error) {
        console.error('Failed to initialize download directory:', error);
      }
    };

    initializeDownloadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Connect download service to state updates
   * Requirements: 4.2, 4.6
   */
  useEffect(() => {
    const handleDownloadUpdate = (download: Download) => {
      // Update or add download in state
      const existingDownload = state.downloads.get(download.videoId);
      if (existingDownload) {
        actions.updateDownload(download.videoId, download);
      } else {
        actions.addDownload(download);
      }
    };

    // Register event listener
    downloadService.addEventListener(handleDownloadUpdate);

    // Cleanup on unmount
    return () => {
      downloadService.removeEventListener(handleDownloadUpdate);
    };
  }, [state.downloads, actions]);

  /**
   * Register cleanup handlers for application exit
   * Requirements: 6.4
   */
  useEffect(() => {
    // Register beforeunload event handler for browser
    const handleBeforeUnload = () => {
      // Clear search cache
      console.log('Clearing search cache...');
      searchService.clearCache();
      
      // Clear completed downloads
      console.log('Clearing download cache...');
      actions.clearCompletedDownloads();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [actions]);

  /**
   * Handle search submission
   */
  const handleSearch = useCallback(async (query: string) => {
    try {
      actions.setIsSearching(true);
      actions.setSearchQuery(query);
      setHasSearched(true);

      const result = await searchService.search(query);
      
      actions.setSearchResults(result.videos);
      actions.setHasMoreResults(result.hasMore);
      actions.setCurrentPage(1);
    } catch (error) {
      const appError = errorHandler.handle(error as Error);
      actions.addError(appError);
      actions.setSearchResults([]);
      actions.setHasMoreResults(false);
    } finally {
      actions.setIsSearching(false);
    }
  }, [actions]);

  /**
   * Handle load more results
   */
  const handleLoadMore = useCallback(async () => {
    try {
      actions.setIsSearching(true);

      const result = await searchService.loadMore();
      
      actions.appendSearchResults(result.videos);
      actions.setHasMoreResults(result.hasMore);
      actions.setCurrentPage(searchService.getCurrentPage());
    } catch (error) {
      const appError = errorHandler.handle(error as Error);
      actions.addError(appError);
    } finally {
      actions.setIsSearching(false);
    }
  }, [actions]);

  /**
   * Handle video preview
   */
  const handlePreview = useCallback(async (videoUrl: string) => {
    try {
      await videoService.openInBrowser(videoUrl);
    } catch (error) {
      const appError = errorHandler.handle(error as Error);
      actions.addError(appError);
    }
  }, [actions]);

  /**
   * Handle video download
   */
  const handleDownload = useCallback(async (video: VideoMetadata) => {
    try {
      // Convert VideoMetadata to Video
      const fullVideo: Video = {
        ...video,
      };

      // Pass the current download directory to the download service
      // Requirements: 10.6
      await downloadService.downloadVideo(fullVideo, state.settings.downloadDirectory);
    } catch (error) {
      const appError = errorHandler.handle(error as Error);
      actions.addError(appError);
    }
  }, [actions, state.settings.downloadDirectory]);

  /**
   * Handle directory selection
   * Requirements: 10.2, 10.3
   */
  const handleSelectDirectory = useCallback(async () => {
    await actions.selectDownloadDirectory();
  }, [actions]);

  /**
   * Get download state for a video
   */
  const getDownloadState = useCallback((videoId: string): DownloadState => {
    const download = state.downloads.get(videoId);
    return download?.state || DownloadState.IDLE;
  }, [state.downloads]);

  /**
   * Get download progress for a video
   */
  const getDownloadProgress = useCallback((videoId: string): number => {
    const download = state.downloads.get(videoId);
    return download?.progress || 0;
  }, [state.downloads]);

  /**
   * Get download error for a video
   */
  const getDownloadError = useCallback((videoId: string): string | undefined => {
    const download = state.downloads.get(videoId);
    return download?.error;
  }, [state.downloads]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {!hasSearched ? (
        <SearchView 
          onSearch={handleSearch} 
          isLoading={state.isSearching}
          onSelectDirectory={handleSelectDirectory}
          currentDirectory={state.settings.downloadDirectory}
        />
      ) : (
        <div className="flex flex-col h-full">
          {/* Compact search bar at top */}
          <div className="bg-white shadow-sm border-b border-neutral-200 px-6 py-3">
            <div className="max-w-4xl mx-auto">
              <SearchView 
                onSearch={handleSearch} 
                isLoading={state.isSearching} 
                compact={true}
                onSelectDirectory={handleSelectDirectory}
                currentDirectory={state.settings.downloadDirectory}
              />
            </div>
          </div>

          {/* Results grid */}
          <div className="flex-1 overflow-hidden">
            <ResultsGrid
              videos={state.searchResults}
              onLoadMore={handleLoadMore}
              hasMore={state.hasMoreResults}
              isLoading={state.isSearching}
              onPreview={handlePreview}
              onDownload={handleDownload}
              getDownloadState={getDownloadState}
              getDownloadProgress={getDownloadProgress}
              getDownloadError={getDownloadError}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
