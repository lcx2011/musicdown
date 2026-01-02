/**
 * SearchView Component
 * Requirements: 1.1, 1.2, 7.5
 * 
 * Displays a centered search input field for searching Bilibili videos
 */

import React, { useState, KeyboardEvent, ChangeEvent } from 'react';

export interface SearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  compact?: boolean; // New prop for compact mode
}

/**
 * SearchView component for video search
 * 
 * Requirements:
 * - 1.1: Display search input field in center of interface
 * - 1.2: Handle Enter key press to submit search
 * - 7.5: Provide immediate visual feedback on interaction
 */
export const SearchView: React.FC<SearchViewProps> = ({ onSearch, isLoading, compact = false }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Handle input change
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  /**
   * Handle Enter key press to submit search
   * Requirements: 1.2
   */
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  /**
   * Submit search query
   * Validates input is non-empty before submission
   */
  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    
    // Validate input is non-empty before submission
    if (trimmedQuery.length === 0) {
      return;
    }

    onSearch(trimmedQuery);
  };

  // Compact mode for top bar
  if (compact) {
    return (
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="搜索视频..."
          disabled={isLoading}
          className={`
            w-full px-4 py-3 text-base
            border-2 bg-white rounded-xl
            focus:outline-none
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            transition-all duration-200 ease-in-out
            ${isFocused 
              ? 'border-primary-500 ring-2 ring-primary-200' 
              : 'border-neutral-300 hover:border-primary-400'
            }
          `}
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600"></div>
          </div>
        )}

        {/* Search icon when not loading */}
        {!isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
            <svg
              className={`w-5 h-5 ${isFocused ? 'text-primary-600' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Full mode for initial search
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full max-w-3xl px-8">
        {/* Header with smooth fade-in animation */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-primary-600 animate-pulse-slow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-neutral-800 mb-3 tracking-tight">
            Bilibili 视频下载器
          </h1>
          <p className="text-lg text-neutral-600">
            搜索并下载您喜欢的视频
          </p>
        </div>

        {/* Search input with enhanced styling and transitions (Requirements: 7.5) */}
        <div className="relative">
          <div
            className={`
              relative rounded-2xl overflow-hidden
              transition-all duration-300 ease-in-out
              ${isFocused ? 'shadow-card-hover scale-105' : 'shadow-card scale-100'}
            `}
          >
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="输入关键词搜索视频..."
              disabled={isLoading}
              className={`
                w-full px-8 py-5 text-lg
                border-2 bg-white
                focus:outline-none
                disabled:bg-neutral-100 disabled:cursor-not-allowed
                transition-all duration-300 ease-in-out
                ${isFocused 
                  ? 'border-primary-500 ring-4 ring-primary-200' 
                  : 'border-neutral-300 hover:border-primary-400'
                }
              `}
              autoFocus
            />
            
            {/* Loading spinner with smooth animation */}
            {isLoading && (
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-7 w-7 border-3 border-primary-200 border-t-primary-600"></div>
              </div>
            )}

            {/* Search icon when not loading */}
            {!isLoading && (
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-neutral-400 transition-colors duration-200">
                <svg
                  className={`w-6 h-6 ${isFocused ? 'text-primary-600' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Hint text with smooth transition */}
        <div className={`
          mt-5 text-center text-sm transition-all duration-300
          ${isFocused ? 'text-primary-600 font-medium' : 'text-neutral-500'}
        `}>
          <span className="inline-flex items-center gap-2">
            <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-300 rounded">
              Enter
            </kbd>
            <span>键搜索</span>
          </span>
        </div>
      </div>
    </div>
  );
};
