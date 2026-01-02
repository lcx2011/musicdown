/**
 * Tests for ErrorHandler service
 * Requirements: 9.1, 9.2, 9.4
 */

import { ErrorHandler, NetworkError, APIError, FileSystemError } from './ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    // Clear console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Categorization', () => {
    it('should categorize NetworkError as network', () => {
      const error = new NetworkError('Connection failed');
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('network');
    });

    it('should categorize APIError as api', () => {
      const error = new APIError('API request failed', 404);
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('api');
    });

    it('should categorize FileSystemError as filesystem', () => {
      const error = new FileSystemError('Cannot write file', '/path/to/file');
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('filesystem');
    });

    it('should categorize axios timeout error as network', () => {
      const error = new Error('Timeout') as any;
      error.isAxiosError = true;
      error.code = 'ETIMEDOUT';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('network');
    });

    it('should categorize axios connection refused as network', () => {
      const error = new Error('Connection refused') as any;
      error.isAxiosError = true;
      error.code = 'ECONNREFUSED';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('network');
    });

    it('should categorize axios DNS error as network', () => {
      const error = new Error('DNS lookup failed') as any;
      error.isAxiosError = true;
      error.code = 'ENOTFOUND';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('network');
    });

    it('should categorize axios error with response as api', () => {
      const error = new Error('API Error') as any;
      error.isAxiosError = true;
      error.response = { status: 404, data: {} };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('api');
    });

    it('should categorize Node.js ENOSPC error as filesystem', () => {
      const error = new Error('No space left') as any;
      error.code = 'ENOSPC';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('filesystem');
    });

    it('should categorize Node.js EACCES error as filesystem', () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EACCES';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('filesystem');
    });

    it('should categorize unknown errors as unknown', () => {
      const error = new Error('Some random error');
      const appError = errorHandler.handle(error);
      
      expect(appError.type).toBe('unknown');
    });
  });

  describe('User-Friendly Messages', () => {
    it('should generate Chinese network timeout message', () => {
      const error = new Error('Timeout') as any;
      error.isAxiosError = true;
      error.code = 'ETIMEDOUT';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('网络连接超时，请检查网络设置后重试');
    });

    it('should generate Chinese DNS error message', () => {
      const error = new Error('DNS failed') as any;
      error.isAxiosError = true;
      error.code = 'ENOTFOUND';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('无法连接到服务器，请检查网络连接');
    });

    it('should generate Chinese connection refused message', () => {
      const error = new Error('Connection refused') as any;
      error.isAxiosError = true;
      error.code = 'ECONNREFUSED';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('服务器拒绝连接，请稍后重试');
    });

    it('should generate Chinese 404 error message', () => {
      const error = new Error('Not found') as any;
      error.isAxiosError = true;
      error.response = { status: 404, data: {} };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('视频不存在或已被删除');
    });

    it('should generate Chinese 403 error message', () => {
      const error = new Error('Forbidden') as any;
      error.isAxiosError = true;
      error.response = { status: 403, data: {} };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('无权访问该视频');
    });

    it('should generate Chinese rate limit message', () => {
      const error = new Error('Too many requests') as any;
      error.isAxiosError = true;
      error.response = { status: 429, data: {} };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('请求过于频繁，请稍后重试');
    });

    it('should generate Chinese server error message', () => {
      const error = new Error('Server error') as any;
      error.isAxiosError = true;
      error.response = { status: 500, data: {} };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('服务器错误，请稍后重试');
    });

    it('should extract API error message from response', () => {
      const error = new Error('API Error') as any;
      error.isAxiosError = true;
      error.response = { 
        status: 400, 
        data: { message: '视频链接无效' } 
      };
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('获取视频信息失败：视频链接无效');
    });

    it('should generate Chinese disk space error message', () => {
      const error = new Error('No space') as any;
      error.code = 'ENOSPC';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('磁盘空间不足，请清理磁盘后重试');
    });

    it('should generate Chinese permission error message', () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EACCES';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('没有文件写入权限，请检查文件夹权限');
    });

    it('should generate Chinese file not found message', () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('目标文件夹不存在');
    });

    it('should generate generic unknown error message', () => {
      const error = new Error('Random error');
      const appError = errorHandler.handle(error);
      
      expect(appError.message).toBe('发生未知错误，请重试');
    });
  });

  describe('Error Logging', () => {
    it('should log error with timestamp and context', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        operation: 'testOperation',
        videoId: 'BV123456'
      };
      
      errorHandler.handle(error, context);
      
      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].error).toBe(error);
      expect(log[0].context).toEqual(context);
      expect(log[0].timestamp).toBeInstanceOf(Date);
    });

    it('should maintain log size limit of 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        errorHandler.handle(new Error(`Error ${i}`));
      }
      
      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(100);
      // Should keep the most recent 100
      expect(log[0].error.message).toBe('Error 50');
      expect(log[99].error.message).toBe('Error 149');
    });

    it('should clear error log', () => {
      errorHandler.handle(new Error('Test error 1'));
      errorHandler.handle(new Error('Test error 2'));
      
      expect(errorHandler.getErrorLog()).toHaveLength(2);
      
      errorHandler.clearErrorLog();
      
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });

    it('should log to console with error details', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      errorHandler.handle(error, context);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorHandler]',
        expect.objectContaining({
          timestamp: expect.any(String),
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String),
          context
        })
      );
    });
  });

  describe('AppError Generation', () => {
    it('should generate AppError with unique ID', () => {
      const error = new Error('Test error');
      const appError1 = errorHandler.handle(error);
      const appError2 = errorHandler.handle(error);
      
      expect(appError1.id).toBeDefined();
      expect(appError2.id).toBeDefined();
      expect(appError1.id).not.toBe(appError2.id);
    });

    it('should generate AppError with timestamp', () => {
      const error = new Error('Test error');
      const before = new Date();
      const appError = errorHandler.handle(error);
      const after = new Date();
      
      expect(appError.timestamp).toBeInstanceOf(Date);
      expect(appError.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(appError.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate AppError with correct structure', () => {
      const error = new NetworkError('Network failed');
      const appError = errorHandler.handle(error);
      
      expect(appError).toMatchObject({
        id: expect.any(String),
        message: expect.any(String),
        type: 'network',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Custom Error Classes', () => {
    it('should create NetworkError with original error', () => {
      const originalError = new Error('Original');
      const networkError = new NetworkError('Network failed', originalError);
      
      expect(networkError.name).toBe('NetworkError');
      expect(networkError.message).toBe('Network failed');
      expect(networkError.originalError).toBe(originalError);
    });

    it('should create APIError with status code', () => {
      const apiError = new APIError('API failed', 404);
      
      expect(apiError.name).toBe('APIError');
      expect(apiError.message).toBe('API failed');
      expect(apiError.statusCode).toBe(404);
    });

    it('should create FileSystemError with path', () => {
      const fsError = new FileSystemError('Write failed', '/path/to/file');
      
      expect(fsError.name).toBe('FileSystemError');
      expect(fsError.message).toBe('Write failed');
      expect(fsError.path).toBe('/path/to/file');
    });
  });
});
