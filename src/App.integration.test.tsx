/**
 * Integration Test for Search Flow
 * Requirements: 1.2, 2.1, 2.2
 * 
 * Tests the complete search flow:
 * - Search input → API call → Results display
 * - Verify VideoCard components render with correct data
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResponse } from './types';

// Mock Electron shell module
jest.mock('electron', () => ({
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock fs module for CleanupService
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined),
  },
  mkdirSync: jest.fn(),
}));

// Create mock functions that will be used by APIClient
const mockSearchVideos = jest.fn();
const mockExtractVideo = jest.fn();

// Mock APIClient module
jest.mock('./services/APIClient', () => {
  return {
    APIClient: jest.fn().mockImplementation(() => {
      return {
        searchVideos: (...args: any[]) => mockSearchVideos(...args),
        extractVideo: (...args: any[]) => mockExtractVideo(...args),
      };
    }),
  };
});

// Import after mocks are set up
import App from './App';
import { AppProvider } from './context/AppContext';

describe('Integration Test: Search Flow', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test: Search input → API call → Results display
   * Requirements: 1.2, 2.1, 2.2
   */
  it('should complete the full search flow from input to results display', async () => {
    // Arrange: Setup mock API response with test data (Bilibili format)
    const mockSearchResponse: SearchResponse = {
      code: 0,
      message: '0',
      ttl: 1,
      data: {
        seid: '12345678901234567890',
        page: 1,
        pagesize: 20,
        numResults: 3,
        numPages: 1,
        suggest_keyword: '',
        rqt_type: 'search',
        cost_time: {},
        exp_list: {},
        egg_hit: 0,
        result: [
          {
            type: 'video',
            id: 1,
            aid: 1,
            bvid: 'BV1test123',
            title: '测试视频标题1',
            description: '测试描述1',
            author: '测试UP主1',
            mid: 123,
            typeid: '1',
            typename: '测试分区',
            arcurl: 'http://www.bilibili.com/video/av1',
            pic: '//example.com/thumbnail1.jpg',
            play: 10000,
            video_review: 100,
            favorites: 50,
            tag: '测试',
            review: 20,
            pubdate: 1640000000,
            senddate: 1640000000,
            duration: '5:00',
            badgepay: false,
            hit_columns: ['title'],
            view_type: '',
            is_pay: 0,
            is_union_video: 0,
            rec_tags: null,
            new_rec_tags: [],
            rank_score: 100,
          },
          {
            type: 'video',
            id: 2,
            aid: 2,
            bvid: 'BV2test456',
            title: '测试视频标题2',
            description: '测试描述2',
            author: '测试UP主2',
            mid: 124,
            typeid: '1',
            typename: '测试分区',
            arcurl: 'http://www.bilibili.com/video/av2',
            pic: '//example.com/thumbnail2.jpg',
            play: 20000,
            video_review: 200,
            favorites: 100,
            tag: '测试',
            review: 40,
            pubdate: 1640000000,
            senddate: 1640000000,
            duration: '10:00',
            badgepay: false,
            hit_columns: ['title'],
            view_type: '',
            is_pay: 0,
            is_union_video: 0,
            rec_tags: null,
            new_rec_tags: [],
            rank_score: 100,
          },
          {
            type: 'video',
            id: 3,
            aid: 3,
            bvid: 'BV3test789',
            title: '测试视频标题3',
            description: '测试描述3',
            author: '测试UP主3',
            mid: 125,
            typeid: '1',
            typename: '测试分区',
            arcurl: 'http://www.bilibili.com/video/av3',
            pic: '//example.com/thumbnail3.jpg',
            play: 5000,
            video_review: 50,
            favorites: 25,
            tag: '测试',
            review: 10,
            pubdate: 1640000000,
            senddate: 1640000000,
            duration: '3:00',
            badgepay: false,
            hit_columns: ['title'],
            view_type: '',
            is_pay: 0,
            is_union_video: 0,
            rec_tags: null,
            new_rec_tags: [],
            rank_score: 100,
          },
        ],
        show_column: 0,
      },
    };

    mockSearchVideos.mockResolvedValue(mockSearchResponse);

    // Act: Render the application
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Assert: Search input should be visible initially
    const searchInput = screen.getByPlaceholderText('输入关键词搜索视频...');
    expect(searchInput).toBeInTheDocument();

    // Act: Type search query and press Enter
    await userEvent.type(searchInput, '测试搜索');
    await userEvent.keyboard('{Enter}');

    // Assert: API should be called with the search query
    await waitFor(() => {
      expect(mockSearchVideos).toHaveBeenCalledWith('测试搜索', 1);
    });

    // Assert: VideoCard components should render with correct data (Requirement 2.2)
    // Check that all video titles are displayed
    await waitFor(() => {
      expect(screen.getByText('测试视频标题1')).toBeInTheDocument();
      expect(screen.getByText('测试视频标题2')).toBeInTheDocument();
      expect(screen.getByText('测试视频标题3')).toBeInTheDocument();
    });

    // Assert: VideoCard should display uploader names (Requirement 2.2)
    expect(screen.getByText('测试UP主1')).toBeInTheDocument();
    expect(screen.getByText('测试UP主2')).toBeInTheDocument();
    expect(screen.getByText('测试UP主3')).toBeInTheDocument();

    // Assert: VideoCard should display formatted durations (Requirement 2.2)
    expect(screen.getByText('5:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();

    // Assert: VideoCard should have thumbnails (Requirement 2.2)
    const thumbnails = screen.getAllByRole('img', { name: /测试视频标题/ });
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute('src', 'https://example.com/thumbnail1.jpg');
    expect(thumbnails[1]).toHaveAttribute('src', 'https://example.com/thumbnail2.jpg');
    expect(thumbnails[2]).toHaveAttribute('src', 'https://example.com/thumbnail3.jpg');

    // Assert: Download buttons should be present for each video
    const downloadButtons = screen.getAllByRole('button', { name: /下载/ });
    expect(downloadButtons).toHaveLength(3);

    // Assert: Grid container should exist with proper classes (Requirement 2.1)
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1');
  });

  /**
   * Test: Empty search results display
   * Requirements: 1.4
   */
  it('should display empty state message when no results are found', async () => {
    // Arrange: Setup mock API response with no results
    const mockEmptyResponse: SearchResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        seid: 'test-seid',
        page: 1,
        pagesize: 20,
        numResults: 0,
        numPages: 0,
        suggest_keyword: '',
        rqt_type: 'search',
        cost_time: {},
        exp_list: {},
        egg_hit: 0,
        result: [],
        show_column: 0,
      },
    };

    mockSearchVideos.mockResolvedValue(mockEmptyResponse);

    // Act: Render the application
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Act: Perform search
    const searchInput = screen.getByPlaceholderText('输入关键词搜索视频...');
    await userEvent.type(searchInput, '不存在的视频');
    await userEvent.keyboard('{Enter}');

    // Assert: Empty state message should be displayed
    await waitFor(() => {
      expect(screen.getByText('没有找到相关视频')).toBeInTheDocument();
      expect(screen.getByText('请尝试其他关键词搜索')).toBeInTheDocument();
    });
  });

  /**
   * Test: Loading state during search
   * Requirements: 1.2
   */
  it('should display loading indicator during search', async () => {
    // Arrange: Setup mock API with delayed response
    mockSearchVideos.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            result: { video: [] },
            page: { count: 0, pn: 1, ps: 20 },
          });
        }, 100);
      });
    });

    // Act: Render the application
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Act: Start search
    const searchInput = screen.getByPlaceholderText('输入关键词搜索视频...');
    await userEvent.type(searchInput, '测试');
    await userEvent.keyboard('{Enter}');

    // Assert: Loading spinner should be visible
    await waitFor(() => {
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    // Wait for search to complete
    await waitFor(() => {
      expect(mockSearchVideos).toHaveBeenCalled();
    });
  });

  /**
   * Test: Search input validation
   * Requirements: 1.2
   */
  it('should not submit empty search query', async () => {
    // Act: Render the application
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Act: Try to submit empty search
    const searchInput = screen.getByPlaceholderText('输入关键词搜索视频...');
    await userEvent.click(searchInput);
    await userEvent.keyboard('{Enter}');

    // Assert: API should not be called
    expect(mockSearchVideos).not.toHaveBeenCalled();
  });
});
