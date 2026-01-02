/**
 * ResultsGrid Component
 * Requirements: 2.1, 2.3, 2.5, 1.4
 * 
 * Displays search results as a grid of video cards with infinite scroll
 */

import React, { useEffect, useRef, UIEvent } from 'react';
import { VideoMetadata, DownloadState } from '../types';
import { VideoCard } from './VideoCard';

export interface ResultsGridProps {
  videos: VideoMetadata[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  onPreview: (videoUrl: string) => void;
  onDownload: (video: VideoMetadata) => void;
  getDownloadState: (videoId: string) => DownloadState;
  getDownloadProgress: (videoId: string) => number;
  getDownloadError: (videoId: string) => string | undefined;
}

/**
 * ResultsGrid component for displaying video search results
 * 
 * Requirements:
 * - 2.1: Display videos as a grid of cards
 * - 2.3: Load additional results when scrolled near bottom
 * - 2.5: Configure responsive grid with consistent spacing
 * - 1.4: Handle empty results state with message
 */
export const ResultsGrid: React.FC<ResultsGridProps> = ({
  videos,
  onLoadMore,
  hasMore,
  isLoading,
  onPreview,
  onDownload,
  getDownloadState,
  getDownloadProgress,
  getDownloadError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  /**
   * Handle scroll event to detect when user is near bottom
   * Requirements: 2.3
   */
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // Trigger loadMore when within 100px of bottom (Requirement 2.3)
    if (distanceFromBottom < 100 && hasMore && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      onLoadMore();
      
      // Reset loading flag after a short delay
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 500);
    }
  };

  /**
   * Reset loading flag when videos change
   */
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [videos.length]);

  /**
   * Render empty state message
   * Requirements: 1.4
   */
  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        <div className="text-center px-8 animate-fade-in">
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-neutral-700 mb-3">
            没有找到相关视频
          </h3>
          <p className="text-neutral-500 text-lg">
            请尝试其他关键词搜索
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 via-white to-neutral-50"
    >
      <div className="px-6 py-6">
        {/* Responsive grid layout of video cards (Requirements: 2.1, 2.5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="animate-fade-in"
              style={{
                animationDelay: `${(index % 12) * 50}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <VideoCard
                video={video}
                onPreview={onPreview}
                onDownload={onDownload}
                downloadState={getDownloadState(video.id)}
                downloadProgress={getDownloadProgress(video.id)}
                downloadError={getDownloadError(video.id)}
              />
            </div>
          ))}
        </div>

        {/* Loading indicator for additional results */}
        {isLoading && videos.length > 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-md">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-200 border-t-primary-600"></div>
                <span className="text-base font-medium text-neutral-700">加载更多...</span>
              </div>
            </div>
          </div>
        )}

        {/* End of results indicator */}
        {!hasMore && videos.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-neutral-500 bg-white px-5 py-2 rounded-lg shadow-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium">已显示全部结果</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
