/**
 * Core data models and types for Bilibili Downloader
 * Requirements: 5.2, 8.1
 */

// ============================================================================
// Video Data Models
// ============================================================================

/**
 * Complete video information including metadata and URLs
 */
export interface Video {
  id: string;              // Bilibili video ID (e.g., "BV1UNs6zBEkN")
  title: string;           // Video title
  thumbnail: string;       // Thumbnail image URL
  duration: string;        // Video duration (e.g., "12:34")
  uploader: string;        // UP主 name
  videoUrl: string;        // Full Bilibili video URL
  downloadUrl?: string;    // Direct download URL (from API)
  uploadDate?: string;     // Upload date
  viewCount?: number;      // View count
}

/**
 * Video metadata for display in search results
 */
export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  videoUrl: string;
}

// ============================================================================
// Download State Models
// ============================================================================

/**
 * Download state enumeration
 */
export enum DownloadState {
  IDLE = 'idle',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Download tracking information
 */
export interface Download {
  videoId: string;
  video: Video;
  state: DownloadState;
  progress: number;        // 0-100
  bytesDownloaded: number;
  totalBytes: number;
  filePath?: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

// ============================================================================
// Application State Models
// ============================================================================

/**
 * Error category enumeration
 */
export type ErrorCategory = 'network' | 'api' | 'filesystem' | 'unknown';

/**
 * Application error information
 */
export interface AppError {
  id: string;
  message: string;
  type: ErrorCategory;
  timestamp: Date;
}

/**
 * Global application state
 */
export interface AppState {
  searchQuery: string;
  searchResults: Video[];
  isSearching: boolean;
  currentPage: number;
  hasMoreResults: boolean;
  downloads: Map<string, Download>;
  errors: AppError[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Media information from API response
 */
export interface MediaInfo {
  media_type: string;
  resource_url: string;
  preview_url: string;
}

/**
 * Video extraction API response
 */
export interface ExtractionResponse {
  text: string;
  medias: MediaInfo[];
  overseas: number;
}

/**
 * Video information from search API (Bilibili format)
 */
export interface VideoInfo {
  type: string;           // "video"
  id: number;             // aid (av号)
  aid: number;            // av号
  bvid: string;           // BV号
  title: string;          // 标题（可能包含 <em> 标签）
  description: string;    // 描述
  author: string;         // UP主名称
  mid: number;            // UP主ID
  typeid: string;         // 分区ID
  typename: string;       // 分区名称
  arcurl: string;         // 视频链接
  pic: string;            // 封面图片URL（需要添加 https: 前缀）
  play: number;           // 播放量
  video_review: number;   // 弹幕数
  favorites: number;      // 收藏数
  tag: string;            // 标签
  review: number;         // 评论数
  pubdate: number;        // 发布时间戳
  senddate: number;       // 投稿时间戳
  duration: string;       // 时长（已格式化，如 "4:18"）
  badgepay: boolean;      // 是否付费
  hit_columns: string[];  // 命中的搜索字段
  view_type: string;
  is_pay: number;
  is_union_video: number;
  rec_tags: any;
  new_rec_tags: any[];
  rank_score: number;     // 排序分数
}

/**
 * Search API response (Bilibili format)
 */
export interface SearchResponse {
  code: number;           // 响应码，0表示成功
  message: string;        // 响应消息
  ttl: number;            // TTL
  data: {
    seid: string;         // 搜索ID
    page: number;         // 当前页码
    pagesize: number;     // 每页大小
    numResults: number;   // 总结果数
    numPages: number;     // 总页数
    suggest_keyword: string;
    rqt_type: string;
    cost_time: {
      [key: string]: string;
    };
    exp_list: {
      [key: string]: boolean;
    };
    egg_hit: number;
    result: VideoInfo[];  // 视频结果数组
    show_column: number;
  };
}

// ============================================================================
// Type Guards for Runtime Validation
// ============================================================================

/**
 * Type guard to check if a value is a valid Video object
 */
export function isVideo(value: unknown): value is Video {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const v = value as Record<string, unknown>;
  
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.thumbnail === 'string' &&
    typeof v.duration === 'string' &&
    typeof v.uploader === 'string' &&
    typeof v.videoUrl === 'string' &&
    (v.downloadUrl === undefined || typeof v.downloadUrl === 'string') &&
    (v.uploadDate === undefined || typeof v.uploadDate === 'string') &&
    (v.viewCount === undefined || typeof v.viewCount === 'number')
  );
}

/**
 * Type guard to check if a value is a valid VideoMetadata object
 */
export function isVideoMetadata(value: unknown): value is VideoMetadata {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const v = value as Record<string, unknown>;
  
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.thumbnail === 'string' &&
    typeof v.duration === 'string' &&
    typeof v.uploader === 'string' &&
    typeof v.videoUrl === 'string'
  );
}

/**
 * Type guard to check if a value is a valid DownloadState
 */
export function isDownloadState(value: unknown): value is DownloadState {
  return (
    value === DownloadState.IDLE ||
    value === DownloadState.DOWNLOADING ||
    value === DownloadState.COMPLETED ||
    value === DownloadState.FAILED
  );
}

/**
 * Type guard to check if a value is a valid Download object
 */
export function isDownload(value: unknown): value is Download {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const d = value as Record<string, unknown>;
  
  return (
    typeof d.videoId === 'string' &&
    isVideo(d.video) &&
    isDownloadState(d.state) &&
    typeof d.progress === 'number' &&
    typeof d.bytesDownloaded === 'number' &&
    typeof d.totalBytes === 'number' &&
    (d.filePath === undefined || typeof d.filePath === 'string') &&
    (d.error === undefined || typeof d.error === 'string') &&
    d.startTime instanceof Date &&
    (d.endTime === undefined || d.endTime instanceof Date)
  );
}

/**
 * Type guard to check if a value is a valid ErrorCategory
 */
export function isErrorCategory(value: unknown): value is ErrorCategory {
  return (
    value === 'network' ||
    value === 'api' ||
    value === 'filesystem' ||
    value === 'unknown'
  );
}

/**
 * Type guard to check if a value is a valid AppError object
 */
export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const e = value as Record<string, unknown>;
  
  return (
    typeof e.id === 'string' &&
    typeof e.message === 'string' &&
    isErrorCategory(e.type) &&
    e.timestamp instanceof Date
  );
}

/**
 * Type guard to check if a value is a valid MediaInfo object
 */
export function isMediaInfo(value: unknown): value is MediaInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const m = value as Record<string, unknown>;
  
  return (
    typeof m.media_type === 'string' &&
    typeof m.resource_url === 'string' &&
    typeof m.preview_url === 'string'
  );
}

/**
 * Type guard to check if a value is a valid ExtractionResponse object
 */
export function isExtractionResponse(value: unknown): value is ExtractionResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const r = value as Record<string, unknown>;
  
  return (
    typeof r.text === 'string' &&
    Array.isArray(r.medias) &&
    r.medias.every(isMediaInfo) &&
    typeof r.overseas === 'number'
  );
}

/**
 * Type guard to check if a value is a valid VideoInfo object
 */
export function isVideoInfo(value: unknown): value is VideoInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const v = value as Record<string, unknown>;
  
  return (
    typeof v.type === 'string' &&
    typeof v.id === 'number' &&
    typeof v.aid === 'number' &&
    typeof v.bvid === 'string' &&
    typeof v.title === 'string' &&
    typeof v.author === 'string' &&
    typeof v.pic === 'string' &&
    typeof v.duration === 'string' &&
    typeof v.play === 'number' &&
    typeof v.pubdate === 'number'
  );
}

/**
 * Type guard to check if a value is a valid SearchResponse object
 */
export function isSearchResponse(value: unknown): value is SearchResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const r = value as Record<string, unknown>;
  
  // Check top-level fields
  if (typeof r.code !== 'number' || typeof r.message !== 'string') {
    return false;
  }
  
  // Check data object
  if (typeof r.data !== 'object' || r.data === null) {
    return false;
  }
  
  const data = r.data as Record<string, unknown>;
  
  // Check required data fields
  if (typeof data.page !== 'number' || typeof data.pagesize !== 'number') {
    return false;
  }
  
  if (!Array.isArray(data.result)) {
    return false;
  }
  
  // Validate at least the structure (not every item for performance)
  return true;
}

/**
 * Type guard to check if a value is a valid AppState object
 */
export function isAppState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const s = value as Record<string, unknown>;
  
  return (
    typeof s.searchQuery === 'string' &&
    Array.isArray(s.searchResults) &&
    s.searchResults.every(isVideo) &&
    typeof s.isSearching === 'boolean' &&
    typeof s.currentPage === 'number' &&
    typeof s.hasMoreResults === 'boolean' &&
    s.downloads instanceof Map &&
    Array.isArray(s.errors) &&
    s.errors.every(isAppError)
  );
}
