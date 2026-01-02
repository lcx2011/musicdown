/**
 * Application Context for global state management
 * Requirements: 4.2, 4.6
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppState, AppError, Download, Video, DownloadState } from '../types';

/**
 * Actions for updating application state
 */
export interface AppActions {
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Video[]) => void;
  appendSearchResults: (results: Video[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setCurrentPage: (page: number) => void;
  setHasMoreResults: (hasMore: boolean) => void;
  clearSearchResults: () => void;

  // Download actions
  addDownload: (download: Download) => void;
  updateDownload: (videoId: string, updates: Partial<Download>) => void;
  removeDownload: (videoId: string) => void;
  getDownload: (videoId: string) => Download | undefined;
  clearCompletedDownloads: () => void;

  // Error actions
  addError: (error: AppError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
}

/**
 * Combined context value with state and actions
 */
export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

/**
 * Create the context with undefined default value
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Props for AppProvider component
 */
export interface AppProviderProps {
  children: ReactNode;
}

/**
 * Initial application state
 */
const initialState: AppState = {
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  currentPage: 1,
  hasMoreResults: false,
  downloads: new Map<string, Download>(),
  errors: [],
};

/**
 * Application Context Provider
 * 
 * Requirements:
 * - 4.2: Track download progress and state
 * - 4.6: Update UI to reflect download completion status
 */
export function AppProvider({ children }: AppProviderProps): JSX.Element {
  const [state, setState] = useState<AppState>(initialState);

  // ============================================================================
  // Search Actions
  // ============================================================================

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSearchResults = useCallback((results: Video[]) => {
    setState(prev => ({ ...prev, searchResults: results }));
  }, []);

  const appendSearchResults = useCallback((results: Video[]) => {
    setState(prev => ({
      ...prev,
      searchResults: [...prev.searchResults, ...results],
    }));
  }, []);

  const setIsSearching = useCallback((isSearching: boolean) => {
    setState(prev => ({ ...prev, isSearching }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const setHasMoreResults = useCallback((hasMore: boolean) => {
    setState(prev => ({ ...prev, hasMoreResults: hasMore }));
  }, []);

  const clearSearchResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      searchResults: [],
      currentPage: 1,
      hasMoreResults: false,
    }));
  }, []);

  // ============================================================================
  // Download Actions
  // ============================================================================

  const addDownload = useCallback((download: Download) => {
    setState(prev => {
      const newDownloads = new Map(prev.downloads);
      newDownloads.set(download.videoId, download);
      return { ...prev, downloads: newDownloads };
    });
  }, []);

  const updateDownload = useCallback((videoId: string, updates: Partial<Download>) => {
    setState(prev => {
      const download = prev.downloads.get(videoId);
      if (!download) {
        return prev;
      }

      const updatedDownload = { ...download, ...updates };
      const newDownloads = new Map(prev.downloads);
      newDownloads.set(videoId, updatedDownload);
      return { ...prev, downloads: newDownloads };
    });
  }, []);

  const removeDownload = useCallback((videoId: string) => {
    setState(prev => {
      const newDownloads = new Map(prev.downloads);
      newDownloads.delete(videoId);
      return { ...prev, downloads: newDownloads };
    });
  }, []);

  const getDownload = useCallback((videoId: string): Download | undefined => {
    return state.downloads.get(videoId);
  }, [state.downloads]);

  const clearCompletedDownloads = useCallback(() => {
    setState(prev => {
      const newDownloads = new Map(prev.downloads);
      for (const [videoId, download] of newDownloads.entries()) {
        if (download.state === DownloadState.COMPLETED || download.state === DownloadState.FAILED) {
          newDownloads.delete(videoId);
        }
      }
      return { ...prev, downloads: newDownloads };
    });
  }, []);

  // ============================================================================
  // Error Actions
  // ============================================================================

  const addError = useCallback((error: AppError) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
  }, []);

  const removeError = useCallback((errorId: string) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.id !== errorId),
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const actions: AppActions = {
    setSearchQuery,
    setSearchResults,
    appendSearchResults,
    setIsSearching,
    setCurrentPage,
    setHasMoreResults,
    clearSearchResults,
    addDownload,
    updateDownload,
    removeDownload,
    getDownload,
    clearCompletedDownloads,
    addError,
    removeError,
    clearErrors,
  };

  const contextValue: AppContextValue = {
    state,
    actions,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access the application context
 * 
 * @throws Error if used outside of AppProvider
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}

/**
 * Hook to access only the application state
 */
export function useAppState(): AppState {
  const { state } = useAppContext();
  return state;
}

/**
 * Hook to access only the application actions
 */
export function useAppActions(): AppActions {
  const { actions } = useAppContext();
  return actions;
}
