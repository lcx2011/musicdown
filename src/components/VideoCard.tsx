/**
 * VideoCard Component
 * Requirements: 2.2, 2.4, 3.1, 4.1, 4.2, 4.6, 7.5
 * 
 * Displays a video card with thumbnail, metadata, and download controls
 */

import React, { useState, MouseEvent } from 'react';
import { VideoMetadata, DownloadState } from '../types';

export interface VideoCardProps {
  video: VideoMetadata;
  onPreview: (videoUrl: string) => void;
  onDownload: (video: VideoMetadata) => void;
  downloadState: DownloadState;
  downloadProgress?: number;
  downloadError?: string;
}

/**
 * VideoCard component for displaying video information
 * 
 * Requirements:
 * - 2.2: Display thumbnail, title, duration, uploader name
 * - 2.4: Display placeholder on thumbnail load failure
 * - 3.1: Handle thumbnail/title click to open browser preview
 * - 4.1: Handle download button click
 * - 4.2: Show progress indicator during download
 * - 4.6: Display completion/error states
 * - 7.5: Provide immediate visual feedback on interaction
 */
export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPreview,
  onDownload,
  downloadState,
  downloadProgress = 0,
  downloadError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handle thumbnail image load error
   * Requirements: 2.4
   */
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[VideoCard] Image load error:', {
      src: video.thumbnail,
      videoId: video.id,
      title: video.title,
      error: e,
    });
    setImageError(true);
  };

  /**
   * Handle preview click (thumbnail or title)
   * Requirements: 3.1
   */
  const handlePreviewClick = (e: MouseEvent) => {
    e.preventDefault();
    onPreview(video.videoUrl);
  };

  /**
   * Handle download button click
   * Requirements: 4.1
   */
  const handleDownloadClick = (e: MouseEvent) => {
    e.preventDefault();
    
    // Only allow download if not currently downloading
    if (downloadState !== DownloadState.DOWNLOADING) {
      onDownload(video);
    }
  };

  /**
   * Get button text based on download state
   * Requirements: 4.6
   */
  const getButtonText = (): string => {
    switch (downloadState) {
      case DownloadState.DOWNLOADING:
        return `下载中 ${downloadProgress}%`;
      case DownloadState.COMPLETED:
        return '✓ 已完成';
      case DownloadState.FAILED:
        return '↻ 重试下载';
      case DownloadState.IDLE:
      default:
        return '↓ 下载';
    }
  };

  /**
   * Get button styling based on download state
   * Requirements: 4.6, 7.5
   */
  const getButtonClassName = (): string => {
    const baseClasses = 'w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ease-in-out transform';
    
    switch (downloadState) {
      case DownloadState.DOWNLOADING:
        return `${baseClasses} bg-primary-500 text-white cursor-not-allowed shadow-md`;
      case DownloadState.COMPLETED:
        return `${baseClasses} bg-success-500 text-white shadow-md hover:shadow-lg hover:bg-success-600 active:scale-95`;
      case DownloadState.FAILED:
        return `${baseClasses} bg-danger-500 text-white shadow-md hover:shadow-lg hover:bg-danger-600 active:scale-95`;
      case DownloadState.IDLE:
      default:
        return `${baseClasses} bg-primary-600 text-white shadow-md hover:shadow-lg hover:bg-primary-700 hover:scale-105 active:scale-95`;
    }
  };

  return (
    <div
      className={`
        bg-white rounded-2xl overflow-hidden
        transition-all duration-300 ease-in-out transform
        ${isHovered ? 'shadow-card-hover scale-105' : 'shadow-card scale-100'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail with hover effects (Requirements: 7.5) */}
      <div
        className="relative w-full h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 cursor-pointer overflow-hidden group"
        onClick={handlePreviewClick}
      >
        {!imageError ? (
          <>
            <img
              src={video.thumbnail}
              alt={video.title}
              onError={handleImageError}
              loading="lazy"
              className={`
                w-full h-full object-cover
                transition-transform duration-500 ease-out
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
            />
            {/* Overlay on hover for better visual feedback */}
            <div className={`
              absolute inset-0 bg-black transition-opacity duration-300
              ${isHovered ? 'opacity-20' : 'opacity-0'}
            `} />
            {/* Play icon overlay on hover */}
            <div className={`
              absolute inset-0 flex items-center justify-center
              transition-opacity duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              <div className="bg-white bg-opacity-90 rounded-full p-4 transform transition-transform duration-300 hover:scale-110">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          // Placeholder for failed image load (Requirement 2.4)
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-300 to-neutral-400">
            <svg
              className="w-16 h-16 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Duration badge with enhanced styling */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm">
          {video.duration}
        </div>
      </div>

      {/* Video information with enhanced spacing */}
      <div className="p-5">
        {/* Title - clickable for preview with smooth color transition */}
        <h3
          className={`
            text-lg font-bold text-neutral-800 mb-3 line-clamp-2 cursor-pointer
            transition-colors duration-200
            ${isHovered ? 'text-primary-600' : ''}
          `}
          onClick={handlePreviewClick}
          title={video.title}
        >
          {video.title}
        </h3>

        {/* Uploader with icon */}
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-4 h-4 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <p className="text-sm text-neutral-600 truncate">
            {video.uploader}
          </p>
        </div>

        {/* Download button with state-based styling (Requirements: 4.6, 7.5) */}
        <button
          onClick={handleDownloadClick}
          disabled={downloadState === DownloadState.DOWNLOADING}
          className={getButtonClassName()}
        >
          {getButtonText()}
        </button>

        {/* Progress bar for downloading state with smooth animation (Requirements: 4.2) */}
        {downloadState === DownloadState.DOWNLOADING && (
          <div className="mt-3 w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}

        {/* Error message with enhanced styling */}
        {downloadState === DownloadState.FAILED && downloadError && (
          <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-danger-700 break-words">
                {downloadError}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
