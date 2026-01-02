/**
 * Centralized error handling service
 * Requirements: 9.1, 9.2, 9.4
 */

import { AppError, ErrorCategory } from '../types';

/**
 * Error context information for logging
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
  videoId?: string;
  url?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Custom error classes for different error categories
 */
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: Error) {
    super(message);
    this.name = 'APIError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public path?: string, public originalError?: Error) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Centralized error handler with categorization and user-friendly messaging
 */
export class ErrorHandler {
  private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private readonly MAX_LOG_SIZE = 100;

  /**
   * Handle an error with categorization, logging, and user-friendly messaging
   * @param error The error to handle
   * @param context Additional context information
   * @returns AppError object with user-friendly message
   */
  handle(error: Error, context: ErrorContext = {}): AppError {
    // Log error details
    this.logError(error, context);

    // Categorize error
    const category = this.categorize(error);

    // Generate user-friendly message
    const userMessage = this.getUserMessage(category, error);

    // Create AppError object
    const appError: AppError = {
      id: this.generateErrorId(),
      message: userMessage,
      type: category,
      timestamp: new Date()
    };

    return appError;
  }

  /**
   * Categorize an error based on its type and properties
   * @param error The error to categorize
   * @returns ErrorCategory
   */
  private categorize(error: Error): ErrorCategory {
    if (error instanceof NetworkError) {
      return 'network';
    }
    
    if (error instanceof APIError) {
      return 'api';
    }
    
    if (error instanceof FileSystemError) {
      return 'filesystem';
    }

    // Check for axios network errors
    if (this.isAxiosError(error)) {
      const axiosError = error as any;
      if (axiosError.code === 'ECONNABORTED' || 
          axiosError.code === 'ETIMEDOUT' ||
          axiosError.code === 'ENOTFOUND' ||
          axiosError.code === 'ECONNREFUSED' ||
          !axiosError.response) {
        return 'network';
      }
      return 'api';
    }

    // Check for Node.js file system errors
    if (this.isNodeError(error)) {
      const nodeError = error as any;
      if (nodeError.code === 'ENOENT' ||
          nodeError.code === 'EACCES' ||
          nodeError.code === 'ENOSPC' ||
          nodeError.code === 'EPERM') {
        return 'filesystem';
      }
    }

    return 'unknown';
  }

  /**
   * Generate user-friendly Chinese error message based on category
   * @param category Error category
   * @param error Original error
   * @returns User-friendly Chinese message
   */
  private getUserMessage(category: ErrorCategory, error: Error): string {
    switch (category) {
      case 'network':
        return this.getNetworkErrorMessage(error);
      
      case 'api':
        return this.getAPIErrorMessage(error);
      
      case 'filesystem':
        return this.getFileSystemErrorMessage(error);
      
      case 'unknown':
      default:
        return '发生未知错误，请重试';
    }
  }

  /**
   * Generate network error message
   * @param error The error
   * @returns Chinese error message
   */
  private getNetworkErrorMessage(error: Error): string {
    const axiosError = error as any;
    
    if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
      return '网络连接超时，请检查网络设置后重试';
    }
    
    if (axiosError.code === 'ENOTFOUND') {
      return '无法连接到服务器，请检查网络连接';
    }
    
    if (axiosError.code === 'ECONNREFUSED') {
      return '服务器拒绝连接，请稍后重试';
    }
    
    return '网络连接失败，请检查网络设置后重试';
  }

  /**
   * Generate API error message
   * @param error The error
   * @returns Chinese error message
   */
  private getAPIErrorMessage(error: Error): string {
    if (error instanceof APIError && error.message) {
      return `获取视频信息失败：${error.message}`;
    }

    const axiosError = error as any;
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      if (status === 404) {
        return '视频不存在或已被删除';
      }
      
      if (status === 403) {
        return '无权访问该视频';
      }
      
      if (status === 429) {
        return '请求过于频繁，请稍后重试';
      }
      
      if (status >= 500) {
        return '服务器错误，请稍后重试';
      }

      // Try to extract error message from response
      const data = axiosError.response.data;
      if (data && typeof data === 'object') {
        if (data.message) {
          return `获取视频信息失败：${data.message}`;
        }
        if (data.error) {
          return `获取视频信息失败：${data.error}`;
        }
      }
    }
    
    return `获取视频信息失败：${error.message || '未知错误'}`;
  }

  /**
   * Generate file system error message
   * @param error The error
   * @returns Chinese error message
   */
  private getFileSystemErrorMessage(error: Error): string {
    if (error instanceof FileSystemError && error.message) {
      return `文件保存失败：${error.message}`;
    }

    const nodeError = error as any;
    
    if (nodeError.code === 'ENOSPC') {
      return '磁盘空间不足，请清理磁盘后重试';
    }
    
    if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
      return '没有文件写入权限，请检查文件夹权限';
    }
    
    if (nodeError.code === 'ENOENT') {
      return '目标文件夹不存在';
    }
    
    return `文件保存失败：${error.message || '未知错误'}`;
  }

  /**
   * Log error details with timestamp and context
   * @param error The error to log
   * @param context Error context
   */
  private logError(error: Error, context: ErrorContext): void {
    const logEntry = {
      error,
      context,
      timestamp: new Date()
    };

    // Add to error log
    this.errorLog.push(logEntry);

    // Maintain log size limit
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Console log for debugging
    console.error('[ErrorHandler]', {
      timestamp: logEntry.timestamp.toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    });
  }

  /**
   * Get error log entries
   * @returns Array of error log entries
   */
  getErrorLog(): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Generate unique error ID
   * @returns Unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is an axios error
   * @param error The error to check
   * @returns True if axios error
   */
  private isAxiosError(error: Error): boolean {
    return (error as any).isAxiosError === true;
  }

  /**
   * Check if error is a Node.js error with code
   * @param error The error to check
   * @returns True if Node.js error
   */
  private isNodeError(error: Error): boolean {
    return typeof (error as any).code === 'string';
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
