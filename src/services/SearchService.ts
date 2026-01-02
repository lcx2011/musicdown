/**
 * Search Service for Bilibili video search
 * Requirements: 1.2, 1.5, 2.3
 */

import { APIClient } from './APIClient';
import { VideoMetadata, VideoInfo, SearchResponse } from '../types';

/**
 * Search result interface
 */
export interface SearchResult {
  videos: VideoMetadata[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * Cache entry for search results
 */
interface CacheEntry {
  result: SearchResult;
  timestamp: number;
}

/**
 * Search Service configuration
 */
export interface SearchServiceConfig {
  cacheTimeout?: number; // Cache timeout in milliseconds (default: 5 minutes)
  pageSize?: number;     // Number of results per page
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SearchServiceConfig> = {
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  pageSize: 20,
};

/**
 * Search Service for querying Bilibili videos
 * 
 * Requirements:
 * - 1.2: Submit search query to retrieve matching videos
 * - 1.5: Sanitize search input to prevent errors
 * - 2.3: Load additional results (pagination)
 */
export class SearchService {
  private apiClient: APIClient;
  private config: Required<SearchServiceConfig>;
  private cache: Map<string, CacheEntry>;
  private currentQuery: string = '';
  private currentPage: number = 1;

  constructor(apiClient: APIClient, config: SearchServiceConfig = {}) {
    this.apiClient = apiClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
  }

  /**
   * Sanitize search query to prevent errors
   * 
   * Requirements: 1.5
   * - Remove or escape special characters that could cause errors
   * - Trim whitespace from query
   * - Validate query is non-empty after sanitization
   * 
   * @param query - Raw search query from user input
   * @returns Sanitized query string
   * @throws Error if query is empty after sanitization
   */
  sanitizeQuery(query: string): string {
    // Trim whitespace from beginning and end
    let sanitized = query.trim();

    // Remove or escape special characters that could cause API errors
    // Keep alphanumeric, spaces, Chinese characters, and common punctuation
    // Remove control characters and other potentially problematic characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    
    // Remove multiple consecutive spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Trim again after character removal
    sanitized = sanitized.trim();

    // Validate query is non-empty after sanitization
    if (sanitized.length === 0) {
      throw new Error('Search query cannot be empty');
    }

    return sanitized;
  }

  /**
   * Generate cache key for a query and page combination
   */
  private getCacheKey(query: string, page: number): string {
    return `${query}:${page}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.config.cacheTimeout;
  }

  /**
   * Get cached search result if available and valid
   */
  private getCachedResult(query: string, page: number): SearchResult | null {
    const key = this.getCacheKey(query, page);
    const entry = this.cache.get(key);

    if (entry && this.isCacheValid(entry)) {
      return entry.result;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store search result in cache
   */
  private cacheResult(query: string, page: number, result: SearchResult): void {
    const key = this.getCacheKey(query, page);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Transform VideoInfo from API to VideoMetadata format
   * 
   * @param videoInfo - Video information from API response
   * @returns VideoMetadata object for UI display
   */
  private transformVideoInfo(videoInfo: VideoInfo): VideoMetadata {
    // Clean HTML tags from title (e.g., <em class="keyword">)
    const cleanTitle = videoInfo.title.replace(/<[^>]*>/g, '');
    
    // Add https: prefix to thumbnail URL if needed
    let thumbnail = videoInfo.pic;
    if (thumbnail.startsWith('//')) {
      thumbnail = 'https:' + thumbnail;
    }

    // Debug: Log thumbnail URL
    console.log('[SearchService] Thumbnail URL:', thumbnail);

    return {
      id: videoInfo.bvid,
      title: cleanTitle,
      thumbnail: thumbnail,
      duration: videoInfo.duration,  // Already formatted as string (e.g., "4:18")
      uploader: videoInfo.author,
      videoUrl: `https://www.bilibili.com/video/${videoInfo.bvid}`,
    };
  }

  /**
   * Transform API SearchResponse to SearchResult format
   * 
   * @param response - Search response from API
   * @returns SearchResult with transformed video metadata
   */
  private transformSearchResponse(response: SearchResponse): SearchResult {
    const videos = response.data.result.map(v => this.transformVideoInfo(v));
    
    // Calculate if there are more results
    const totalCount = response.data.numResults;
    const currentPage = response.data.page;
    const totalPages = response.data.numPages;
    const hasMore = currentPage < totalPages;

    return {
      videos,
      hasMore,
      totalCount,
    };
  }

  /**
   * Search for videos by query
   * 
   * Requirements: 1.2, 1.5
   * - Submit search query to retrieve matching videos
   * - Sanitize input to prevent errors
   * - Cache results for 5 minutes
   * 
   * @param query - Search query string
   * @returns Promise resolving to search results
   * @throws Error if query is invalid or search fails
   */
  async search(query: string): Promise<SearchResult> {
    // Sanitize query (Requirement 1.5)
    const sanitizedQuery = this.sanitizeQuery(query);

    // Update current query and reset page
    this.currentQuery = sanitizedQuery;
    this.currentPage = 1;

    // Check cache first
    const cachedResult = this.getCachedResult(sanitizedQuery, 1);
    if (cachedResult) {
      return cachedResult;
    }

    // Fetch from API
    const response = await this.apiClient.searchVideos(sanitizedQuery, 1);
    
    // Transform response
    const result = this.transformSearchResponse(response);

    // Cache result
    this.cacheResult(sanitizedQuery, 1, result);

    return result;
  }

  /**
   * Load more results for the current search query (pagination)
   * 
   * Requirements: 2.3
   * - Load additional results when user scrolls to bottom
   * - Support pagination
   * 
   * @returns Promise resolving to additional search results
   * @throws Error if no current search or load fails
   */
  async loadMore(): Promise<SearchResult> {
    if (!this.currentQuery) {
      throw new Error('No active search query');
    }

    // Increment page
    this.currentPage += 1;

    // Check cache first
    const cachedResult = this.getCachedResult(this.currentQuery, this.currentPage);
    if (cachedResult) {
      return cachedResult;
    }

    // Fetch from API
    const response = await this.apiClient.searchVideos(this.currentQuery, this.currentPage);
    
    // Transform response
    const result = this.transformSearchResponse(response);

    // Cache result
    this.cacheResult(this.currentQuery, this.currentPage, result);

    return result;
  }

  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current search query
   */
  getCurrentQuery(): string {
    return this.currentQuery;
  }

  /**
   * Get current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }
}

/**
 * Create a default SearchService instance
 */
export function createSearchService(
  apiClient: APIClient,
  config?: SearchServiceConfig
): SearchService {
  return new SearchService(apiClient, config);
}
