/**
 * API Client for Bilibili video extraction and search
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';
import { ExtractionResponse, SearchResponse } from '../types';
import { withRetry, DEFAULT_RETRY_CONFIG } from '../utils/retry';
import { ENV } from '../config/env';

/**
 * Custom error class for API-related errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * API Client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  enableRetry?: boolean;
}

/**
 * Default API configuration
 * 
 * Configuration is loaded from environment variables:
 * - VITE_API_BASE_URL: Base URL for the API (default: https://api.example.com)
 * - VITE_API_TIMEOUT: Request timeout in milliseconds (default: 30000)
 * - VITE_API_ENABLE_RETRY: Enable retry logic (default: true)
 */
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  enableRetry: ENV.API_ENABLE_RETRY,
};

/**
 * API Client for communicating with Bilibili extraction API
 * 
 * Requirements:
 * - 5.1: POST request to extraction endpoint with video link
 * - 5.2: Parse JSON response to extract download URL
 * - 5.3: Retry failed requests up to 2 times (via withRetry)
 * - 5.4: Extract and display error messages from API responses
 * - 5.5: Include required headers (content-type, g-footer, g-timestamp)
 */
export class APIClient {
  private axiosInstance: AxiosInstance;
  private config: APIClientConfig;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate g-timestamp header (current Unix timestamp in seconds)
   */
  private generateTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  /**
   * Generate g-footer header (hash of request data)
   * 
   * This implements a simple hash-based signature for API requests.
   * In production, this would use the actual algorithm required by the API.
   * 
   * @param data - Request data to hash
   * @param timestamp - Request timestamp
   * @returns Hash string for g-footer header
   */
  private generateFooter(data: string, timestamp: string): string {
    // Simple hash implementation - replace with actual API requirements
    const hash = crypto
      .createHash('md5')
      .update(data + timestamp)
      .digest('hex');
    return hash;
  }

  /**
   * Generate required headers for API requests
   * 
   * Requirements: 5.5
   * - content-type: application/json
   * - g-footer: hash of request data
   * - g-timestamp: current Unix timestamp
   */
  private generateHeaders(data: unknown): Record<string, string> {
    const timestamp = this.generateTimestamp();
    const dataString = JSON.stringify(data);
    const footer = this.generateFooter(dataString, timestamp);

    return {
      'Content-Type': 'application/json',
      'g-footer': footer,
      'g-timestamp': timestamp,
    };
  }

  /**
   * Extract error message from API error response
   * 
   * Requirements: 5.4
   * - Extract error messages from API error responses
   * - Handle various error response formats
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Try to extract error message from response data
      if (axiosError.response?.data) {
        const data = axiosError.response.data as any;
        
        // Common error message fields
        if (typeof data.message === 'string') {
          return data.message;
        }
        if (typeof data.error === 'string') {
          return data.error;
        }
        if (typeof data.msg === 'string') {
          return data.msg;
        }
        
        // If data is a string, use it directly
        if (typeof data === 'string') {
          return data;
        }
      }
      
      // Fall back to axios error message
      if (axiosError.message) {
        return axiosError.message;
      }
    }
    
    // Generic error handling
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Parse extraction response and extract download URL
   * 
   * Requirements: 5.2
   * - Parse ExtractionResponse JSON to extract download URL
   * - Handle malformed JSON responses
   */
  private parseExtractionResponse(data: unknown): ExtractionResponse {
    // Validate response structure
    if (typeof data !== 'object' || data === null) {
      throw new APIError('Invalid response format: expected object');
    }

    const response = data as any;

    // Validate required fields
    if (typeof response.text !== 'string') {
      throw new APIError('Invalid response format: missing or invalid "text" field');
    }

    if (!Array.isArray(response.medias)) {
      throw new APIError('Invalid response format: missing or invalid "medias" field');
    }

    if (typeof response.overseas !== 'number') {
      throw new APIError('Invalid response format: missing or invalid "overseas" field');
    }

    // Validate media items
    for (const media of response.medias) {
      if (typeof media !== 'object' || media === null) {
        throw new APIError('Invalid response format: invalid media item');
      }
      if (typeof media.media_type !== 'string') {
        throw new APIError('Invalid response format: missing media_type');
      }
      if (typeof media.resource_url !== 'string') {
        throw new APIError('Invalid response format: missing resource_url');
      }
      if (typeof media.preview_url !== 'string') {
        throw new APIError('Invalid response format: missing preview_url');
      }
    }

    return response as ExtractionResponse;
  }

  /**
   * Extract video information from Bilibili API
   * 
   * Requirements: 5.1, 5.5
   * - Send POST request to extraction endpoint with video link
   * - Include required headers (content-type, g-footer, g-timestamp)
   * - Retry on failure (via withRetry)
   * 
   * @param videoLink - Full Bilibili video URL
   * @returns Promise resolving to extraction response with download URLs
   * @throws APIError if extraction fails after retries
   */
  async extractVideo(videoLink: string): Promise<ExtractionResponse> {
    // Check if we're in Electron environment
    const isElectron = typeof process !== 'undefined' && 
                       process.versions != null && 
                       process.versions.electron != null;
    
    const operation = async () => {
      try {
        if (isElectron && typeof window !== 'undefined' && window.electronAPI) {
          // Use IPC to make the request from the main process
          const result = await window.electronAPI.extractVideo(videoLink);
          
          if (!result.success) {
            throw new APIError(result.error || 'Video extraction failed', result.statusCode);
          }
          
          // Parse and validate response
          return this.parseExtractionResponse(result.data);
        } else {
          // Fallback to direct HTTP request
          const requestData = { link: videoLink };
          const headers = this.generateHeaders(requestData);
          
          const response = await this.axiosInstance.post<unknown>(
            '/extract',
            requestData,
            { headers }
          );

          // Parse and validate response
          return this.parseExtractionResponse(response.data);
        }
      } catch (error) {
        const errorMessage = this.extractErrorMessage(error);
        const statusCode = axios.isAxiosError(error) 
          ? error.response?.status 
          : undefined;
        
        throw new APIError(errorMessage, statusCode, error);
      }
    };

    // Execute with retry logic if enabled
    if (this.config.enableRetry) {
      return withRetry(operation, DEFAULT_RETRY_CONFIG);
    } else {
      return operation();
    }
  }

  /**
   * Search for videos on Bilibili using the official API
   * 
   * In Electron environment, this uses IPC to make the request from the main process
   * to avoid CORS and unsafe header restrictions in the renderer process.
   * 
   * Requirements: 5.1, 5.5
   * - Send GET request to Bilibili search endpoint
   * - Use proper query parameters
   * - Retry on failure
   * 
   * @param query - Search query string
   * @param page - Page number (default: 1)
   * @returns Promise resolving to search results
   * @throws APIError if search fails after retries
   */
  async searchVideos(query: string, page: number = 1): Promise<SearchResponse> {
    // Check if we're in Electron environment
    // Check for process.type which is set by Electron ('renderer' or 'browser')
    const isElectron = typeof process !== 'undefined' && 
                       process.versions != null && 
                       process.versions.electron != null;

    const operation = async () => {
      try {
        if (isElectron) {
          // Use IPC to make the request from the main process
          const { ipcRenderer } = require('electron');
          const result = await ipcRenderer.invoke('bilibili-search', { keyword: query, page });
          
          if (!result.success) {
            throw new APIError(result.error || 'API request failed', result.statusCode);
          }
          
          const response = result.data;
          
          // Validate response structure
          if (!response || typeof response !== 'object') {
            throw new APIError('Invalid search response format');
          }

          // Check API response code
          if (response.code !== 0) {
            throw new APIError(`Bilibili API error: ${response.message || 'Unknown error'}`, response.code);
          }

          // Validate data structure
          if (!response.data || !Array.isArray(response.data.result)) {
            throw new APIError('Invalid search response: missing result data');
          }

          return response;
        } else {
          // Fallback for non-Electron environments (testing, etc.)
          // Use direct HTTP request with limited headers
          const response = await this.axiosInstance.get<SearchResponse>(
            'https://api.bilibili.com/x/web-interface/search/type',
            {
              params: {
                search_type: 'video',
                keyword: query,
                page: page,
                order: 'totalrank',
                duration: 0,
                tids: 0,
              },
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
              },
            }
          );

          // Validate response structure
          if (!response.data || typeof response.data !== 'object') {
            throw new APIError('Invalid search response format');
          }

          // Check API response code
          if (response.data.code !== 0) {
            throw new APIError(`Bilibili API error: ${response.data.message || 'Unknown error'}`, response.data.code);
          }

          // Validate data structure
          if (!response.data.data || !Array.isArray(response.data.data.result)) {
            throw new APIError('Invalid search response: missing result data');
          }

          return response.data;
        }
      } catch (error) {
        const errorMessage = this.extractErrorMessage(error);
        const statusCode = axios.isAxiosError(error) 
          ? error.response?.status 
          : undefined;
        
        throw new APIError(errorMessage, statusCode, error);
      }
    };

    // Execute with retry logic if enabled
    if (this.config.enableRetry) {
      return withRetry(operation, DEFAULT_RETRY_CONFIG);
    } else {
      return operation();
    }
  }
}

/**
 * Create a default API client instance
 */
export function createAPIClient(config?: Partial<APIClientConfig>): APIClient {
  return new APIClient(config);
}
