# Design Document

## Overview

The Bilibili Downloader is a standalone Windows desktop application built using Electron framework, designed specifically for Windows 7 (32-bit) environments. The application provides a modern, card-based interface for searching, previewing, and downloading Bilibili videos through a private extraction API.

### Technology Stack

- **Framework**: Electron (v22.x - last version supporting Windows 7 32-bit)
- **UI Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **HTTP Client**: Axios for API communication
- **State Management**: React Context API for simple state management
- **Build Tool**: Electron Builder for creating portable executables

### Key Design Principles

1. **Zero Installation**: Single executable with all dependencies bundled
2. **Performance First**: Optimized for older hardware (Windows 7 32-bit)
3. **Visual Appeal**: Modern UI design despite platform constraints
4. **Simplicity**: Minimal clicks from search to download

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Search View  │  │ Results View │  │ Download  │ │
│  │              │  │ (Card Grid)  │  │ Manager   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                   Business Logic Layer              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Search       │  │ Video        │  │ Download  │ │
│  │ Service      │  │ Service      │  │ Service   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                   Data Access Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ API Client   │  │ File System  │  │ Browser   │ │
│  │              │  │ Manager      │  │ Launcher  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                   External Systems                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Bilibili     │  │ Windows      │  │ System    │ │
│  │ API          │  │ File System  │  │ Browser   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Search Flow**: User Input → Search Service → API Client → Bilibili API → Results View
2. **Preview Flow**: Card Click → Browser Launcher → System Browser
3. **Download Flow**: Download Button → Download Service → API Client → File System Manager → Desktop

## Components and Interfaces

### 1. Presentation Layer Components

#### SearchView Component
```typescript
interface SearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

// Responsibilities:
// - Render centered search input field
// - Handle user input and Enter key press
// - Display loading state during search
// - Validate and sanitize search input
```

#### VideoCard Component
```typescript
interface VideoCardProps {
  video: VideoMetadata;
  onPreview: (videoUrl: string) => void;
  onDownload: (video: VideoMetadata) => void;
  downloadState: DownloadState;
}

interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  videoUrl: string;
}

enum DownloadState {
  IDLE = 'idle',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Responsibilities:
// - Display video thumbnail, title, duration, uploader
// - Handle preview click (thumbnail/title)
// - Handle download button click
// - Show download progress indicator
// - Display download completion/error states
```

#### ResultsGrid Component
```typescript
interface ResultsGridProps {
  videos: VideoMetadata[];
  onLoadMore: () => void;
  hasMore: boolean;
}

// Responsibilities:
// - Render grid layout of VideoCard components
// - Handle infinite scroll/pagination
// - Display loading indicator for additional results
// - Handle empty state display
```

### 2. Business Logic Layer

#### SearchService
```typescript
interface SearchService {
  search(query: string): Promise<SearchResult>;
  loadMore(page: number): Promise<SearchResult>;
}

interface SearchResult {
  videos: VideoMetadata[];
  hasMore: boolean;
  totalCount: number;
}

// Responsibilities:
// - Sanitize search queries
// - Coordinate with API Client for search requests
// - Transform API responses to VideoMetadata format
// - Handle pagination logic
// - Cache search results
```

#### VideoService
```typescript
interface VideoService {
  getVideoDetails(videoId: string): Promise<VideoMetadata>;
  constructVideoUrl(videoId: string): string;
  openInBrowser(videoUrl: string): Promise<void>;
}

// Responsibilities:
// - Construct Bilibili video URLs
// - Launch system default browser
// - Handle browser launch errors
```

#### DownloadService
```typescript
interface DownloadService {
  downloadVideo(video: VideoMetadata): Promise<DownloadResult>;
  getDownloadProgress(videoId: string): DownloadProgress;
  cancelDownload(videoId: string): void;
}

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

interface DownloadProgress {
  videoId: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  state: DownloadState;
}

// Responsibilities:
// - Coordinate video download process
// - Track download progress
// - Manage concurrent downloads
// - Handle download errors and retries
// - Notify UI of progress updates
```

### 3. Data Access Layer

#### APIClient
```typescript
interface APIClient {
  extractVideo(videoLink: string): Promise<ExtractionResponse>;
  searchVideos(query: string, page: number): Promise<SearchResponse>;
}

interface ExtractionResponse {
  text: string;
  medias: MediaInfo[];
  overseas: number;
}

interface MediaInfo {
  media_type: string;
  resource_url: string;
  preview_url: string;
}

interface SearchResponse {
  result: {
    video: VideoInfo[];
  };
  page: {
    count: number;
    pn: number;
    ps: number;
  };
}

// Responsibilities:
// - Make HTTP requests to Bilibili API
// - Add required headers (g-footer, g-timestamp)
// - Handle API authentication/signing
// - Implement retry logic (up to 2 retries)
// - Parse and validate API responses
// - Handle network errors
```

#### FileSystemManager
```typescript
interface FileSystemManager {
  getDesktopPath(): string;
  saveFile(filename: string, data: Buffer): Promise<string>;
  sanitizeFilename(filename: string): string;
  checkDiskSpace(requiredBytes: number): Promise<boolean>;
  fileExists(filepath: string): boolean;
}

// Responsibilities:
// - Resolve Windows desktop directory path
// - Write video files to disk
// - Sanitize filenames for Windows compatibility
// - Check available disk space
// - Handle filename conflicts (append numeric suffix)
// - Verify file write success
```

#### BrowserLauncher
```typescript
interface BrowserLauncher {
  openUrl(url: string): Promise<void>;
  isDefaultBrowserAvailable(): boolean;
}

// Responsibilities:
// - Launch system default browser with video URL
// - Detect browser availability
// - Handle browser launch failures
```

## Data Models

### Video Data Model
```typescript
interface Video {
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
```

### Download State Model
```typescript
interface Download {
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
```

### Application State Model
```typescript
interface AppState {
  searchQuery: string;
  searchResults: Video[];
  isSearching: boolean;
  currentPage: number;
  hasMoreResults: boolean;
  downloads: Map<string, Download>;
  errors: AppError[];
}

interface AppError {
  id: string;
  message: string;
  type: 'network' | 'api' | 'filesystem' | 'unknown';
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Search query submission
*For any* valid search query string, when the user submits the search, the search service should be called with that exact query string.
**Validates: Requirements 1.2**

### Property 2: Input sanitization preserves safety
*For any* search query containing special characters, the sanitized output should contain no characters that could cause injection attacks or system errors.
**Validates: Requirements 1.5**

### Property 3: Video card completeness
*For any* video object, when rendered as a card, the resulting HTML should contain the thumbnail URL, title text, duration text, and uploader name.
**Validates: Requirements 2.2**

### Property 4: Infinite scroll trigger
*For any* results grid with more results available, when the user scrolls to within 100px of the bottom, the load more function should be invoked.
**Validates: Requirements 2.3**

### Property 5: Browser URL construction
*For any* valid Bilibili video ID, the constructed URL should follow the format `https://www.bilibili.com/video/{videoId}` and be a valid URL.
**Validates: Requirements 3.2**

### Property 6: Preview launches browser
*For any* video card, when the thumbnail or title is clicked, the browser launcher should be called with the correct video URL.
**Validates: Requirements 3.1**

### Property 7: Download initiation
*For any* video card with idle download state, when the download button is clicked, the download service should be invoked with that video's metadata.
**Validates: Requirements 4.1**

### Property 8: Download state transitions
*For any* video download, the UI state should transition from IDLE → DOWNLOADING → (COMPLETED | FAILED), and the button should reflect each state visually.
**Validates: Requirements 4.2, 4.6**

### Property 9: Duplicate download prevention
*For any* video that is currently downloading, subsequent download button clicks should be ignored until the download completes or fails.
**Validates: Requirements 4.3**

### Property 10: Download saves to desktop
*For any* successfully downloaded video, the file path should start with the Windows desktop directory path and end with a valid filename.
**Validates: Requirements 4.4, 8.4**

### Property 11: Download error recovery
*For any* failed download, the download state should reset to IDLE and an error message should be displayed to the user.
**Validates: Requirements 4.5**

### Property 12: API request structure
*For any* video extraction request, the HTTP POST request should include the video link in the body and all required headers (content-type, g-footer, g-timestamp).
**Validates: Requirements 5.1, 5.5**

### Property 13: API response parsing round-trip
*For any* valid API extraction response JSON, parsing it to extract the download URL and then reconstructing a response object should preserve the download URL value.
**Validates: Requirements 5.2**

### Property 14: Retry logic bounds
*For any* failed API request, the client should retry exactly 2 times before reporting failure, resulting in a maximum of 3 total attempts.
**Validates: Requirements 5.3**

### Property 15: API error message extraction
*For any* API error response, the extracted error message should be non-empty and should be displayed to the user.
**Validates: Requirements 5.4, 9.2**

### Property 16: Cleanup on exit
*For any* application session, when the application closes, all temporary files created during the session should be removed from the file system.
**Validates: Requirements 6.4**

### Property 17: Filename sanitization
*For any* video title containing Windows-invalid characters (< > : " / \ | ? *), the sanitized filename should replace those characters with safe alternatives and remain non-empty.
**Validates: Requirements 8.2**

### Property 18: Filename conflict resolution
*For any* video download where a file with the same name exists, the new filename should have a numeric suffix appended (e.g., "video(1).mp4", "video(2).mp4").
**Validates: Requirements 8.3**

### Property 19: MP4 format preference
*For any* API response containing multiple media formats, if an MP4 format is available, it should be selected as the download format.
**Validates: Requirements 8.5**

### Property 20: Network error messaging
*For any* network error (timeout, connection refused, DNS failure), the displayed error message should indicate a connection problem and be user-friendly.
**Validates: Requirements 9.1**

### Property 21: Disk space validation
*For any* download request, if available disk space is less than 100MB, the download should be prevented and the user should be notified before any download attempt.
**Validates: Requirements 9.3**

### Property 22: Error logging completeness
*For any* unexpected error, the error details (message, stack trace, timestamp) should be logged, and a generic error message should be displayed to the user.
**Validates: Requirements 9.4**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - Server unreachable
   - Strategy: Retry with exponential backoff, display user-friendly message

2. **API Errors**
   - Invalid response format
   - Authentication failure
   - Rate limiting
   - Video not found
   - Strategy: Parse error response, display specific error message, log details

3. **File System Errors**
   - Insufficient disk space
   - Permission denied
   - Invalid path
   - Write failure
   - Strategy: Check preconditions, display actionable error message, cleanup partial files

4. **Application Errors**
   - Unexpected exceptions
   - State corruption
   - Memory issues
   - Strategy: Log full error details, display generic message, attempt graceful recovery

### Error Handling Patterns

```typescript
// Centralized error handler
class ErrorHandler {
  handle(error: Error, context: ErrorContext): void {
    // Log error details
    this.logger.error(error, context);
    
    // Categorize error
    const category = this.categorize(error);
    
    // Display user-friendly message
    const message = this.getUserMessage(category, error);
    this.notificationService.showError(message);
    
    // Attempt recovery if possible
    this.attemptRecovery(category, context);
  }
  
  private categorize(error: Error): ErrorCategory {
    if (error instanceof NetworkError) return ErrorCategory.NETWORK;
    if (error instanceof APIError) return ErrorCategory.API;
    if (error instanceof FileSystemError) return ErrorCategory.FILESYSTEM;
    return ErrorCategory.UNKNOWN;
  }
  
  private getUserMessage(category: ErrorCategory, error: Error): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return '网络连接失败，请检查网络设置后重试';
      case ErrorCategory.API:
        return `获取视频信息失败：${error.message}`;
      case ErrorCategory.FILESYSTEM:
        return `文件保存失败：${error.message}`;
      default:
        return '发生未知错误，请重试';
    }
  }
}
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;      // 3 (1 initial + 2 retries)
  initialDelay: number;     // 1000ms
  maxDelay: number;         // 5000ms
  backoffMultiplier: number; // 2
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < config.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }
  
  throw lastError;
}
```

## Testing Strategy

### Unit Testing

The application will use **Jest** as the testing framework with **React Testing Library** for component testing.

**Unit Test Coverage:**

1. **Component Tests**
   - SearchView: Input handling, Enter key submission, loading states
   - VideoCard: Click handlers, state display, error states
   - ResultsGrid: Grid rendering, scroll detection, empty states

2. **Service Tests**
   - SearchService: Query sanitization, result transformation
   - DownloadService: State management, progress tracking
   - VideoService: URL construction, browser launching

3. **Utility Tests**
   - FileSystemManager: Filename sanitization, conflict resolution
   - APIClient: Request formatting, response parsing
   - ErrorHandler: Error categorization, message generation

4. **Edge Cases**
   - Empty search results display (Requirement 1.4)
   - Image load failure placeholder (Requirement 2.4)
   - Browser unavailable error (Requirement 3.4)

### Property-Based Testing

The application will use **fast-check** as the property-based testing library for JavaScript/TypeScript.

**Property-Based Testing Requirements:**

- Each property-based test MUST run a minimum of 100 iterations
- Each property-based test MUST be tagged with a comment referencing the correctness property
- Tag format: `// Feature: bilibili-downloader-win7, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Test Coverage:**

Property-based tests will verify universal properties across all inputs:

1. **Input Validation Properties**
   - Property 2: Special character sanitization (Requirements 1.5)
   - Property 17: Filename sanitization (Requirements 8.2)

2. **Data Transformation Properties**
   - Property 3: Video card rendering completeness (Requirements 2.2)
   - Property 5: URL construction correctness (Requirements 3.2)
   - Property 13: API response parsing round-trip (Requirements 5.2)

3. **State Management Properties**
   - Property 8: Download state transitions (Requirements 4.2, 4.6)
   - Property 9: Duplicate download prevention (Requirements 4.3)
   - Property 18: Filename conflict resolution (Requirements 8.3)

4. **Error Handling Properties**
   - Property 15: API error message extraction (Requirements 5.4, 9.2)
   - Property 20: Network error messaging (Requirements 9.1)
   - Property 22: Error logging completeness (Requirements 9.4)

**Example Property Test:**

```typescript
// Feature: bilibili-downloader-win7, Property 17: Filename sanitization
describe('FileSystemManager.sanitizeFilename', () => {
  it('should sanitize any filename with invalid characters', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        (filename) => {
          const sanitized = fileSystemManager.sanitizeFilename(filename);
          
          // Property: No Windows-invalid characters remain
          const invalidChars = /[<>:"/\\|?*]/;
          expect(sanitized).not.toMatch(invalidChars);
          
          // Property: Result is non-empty
          expect(sanitized.length).toBeGreaterThan(0);
          
          // Property: Result is a valid Windows filename
          expect(sanitized.length).toBeLessThanOrEqual(255);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify component interactions:

1. **Search to Display Flow**
   - Search submission → API call → Results rendering
   
2. **Download Flow**
   - Download button click → API extraction → File download → Desktop save

3. **Error Flow**
   - API failure → Error display → State reset

### Test Execution Strategy

1. **Development**: Run unit tests on file save
2. **Pre-commit**: Run all unit tests and property tests
3. **CI/CD**: Run full test suite including integration tests
4. **Manual Testing**: Test on actual Windows 7 32-bit VM before release

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Load video thumbnails on-demand as they enter viewport
   - Implement virtual scrolling for large result sets

2. **Caching**
   - Cache search results for 5 minutes
   - Cache thumbnail images in memory
   - Use HTTP cache headers for API responses

3. **Resource Management**
   - Limit concurrent downloads to 3
   - Throttle scroll events to 100ms
   - Debounce search input to 300ms

4. **Memory Management**
   - Clear old search results when new search is performed
   - Release completed download objects after 1 minute
   - Limit error log size to 100 entries

### Windows 7 32-bit Constraints

- Maximum memory usage target: 100MB
- Electron v22.x (last version supporting Win7 32-bit)
- Avoid heavy animations on older hardware
- Use CSS transforms instead of position changes
- Minimize DOM nodes in viewport

## Security Considerations

1. **Input Validation**
   - Sanitize all user inputs before API calls
   - Validate URLs before opening in browser
   - Escape special characters in filenames

2. **API Security**
   - Use HTTPS for all API calls
   - Validate API response structure
   - Implement request signing (g-footer, g-timestamp)

3. **File System Security**
   - Validate file paths before writing
   - Check file extensions
   - Prevent path traversal attacks

4. **Error Information**
   - Don't expose sensitive information in error messages
   - Log detailed errors locally only
   - Show generic messages to users

## Deployment

### Build Configuration

```javascript
// electron-builder.yml
{
  "appId": "com.bilibili.downloader",
  "productName": "Bilibili Downloader",
  "directories": {
    "output": "dist"
  },
  "win": {
    "target": "portable",
    "arch": ["ia32"],
    "icon": "assets/icon.ico"
  },
  "portable": {
    "artifactName": "BilibiliDownloader-Portable.exe"
  }
}
```

### Distribution

- Single portable executable: `BilibiliDownloader-Portable.exe`
- No installer required
- No registry modifications
- All dependencies bundled
- File size target: < 150MB

## Future Enhancements

1. **Batch Download**: Select multiple videos for download
2. **Download Queue**: Manage download order and priorities
3. **Quality Selection**: Choose video quality before download
4. **History**: Track previously downloaded videos
5. **Favorites**: Bookmark videos for later download
6. **Subtitle Download**: Download video subtitles if available
