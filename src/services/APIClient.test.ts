/**
 * Unit tests for APIClient
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { APIClient, APIError } from './APIClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a mock axios instance
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    client = new APIClient({
      baseURL: 'https://test-api.example.com',
      enableRetry: false, // Disable retry for unit tests
    });
  });

  describe('extractVideo', () => {
    it('should successfully extract video with valid response', async () => {
      const mockResponse = {
        data: {
          text: 'Test video',
          medias: [
            {
              media_type: 'mp4',
              resource_url: 'https://example.com/video.mp4',
              preview_url: 'https://example.com/preview.jpg',
            },
          ],
          overseas: 0,
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.extractVideo('https://www.bilibili.com/video/BV123');

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/extract',
        { link: 'https://www.bilibili.com/video/BV123' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'g-footer': expect.any(String),
            'g-timestamp': expect.any(String),
          }),
        })
      );
    });

    it('should throw APIError on invalid response format', async () => {
      const mockResponse = {
        data: {
          invalid: 'response',
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        client.extractVideo('https://www.bilibili.com/video/BV123')
      ).rejects.toThrow(APIError);
    });

    it('should extract error message from API error response', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Video not found',
          },
          status: 404,
        },
        isAxiosError: true,
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.extractVideo('https://www.bilibili.com/video/BV123')
      ).rejects.toThrow('Video not found');
    });
  });

  describe('searchVideos', () => {
    it('should successfully search videos', async () => {
      const mockResponse = {
        data: {
          code: 0,
          message: '0',
          ttl: 1,
          data: {
            seid: '12345678901234567890',
            page: 1,
            pagesize: 20,
            numResults: 1,
            numPages: 1,
            suggest_keyword: '',
            rqt_type: 'search',
            cost_time: {},
            exp_list: {},
            egg_hit: 0,
            result: [
              {
                type: 'video',
                id: 123,
                aid: 123,
                bvid: 'BV123',
                title: 'Test Video',
                description: 'Test',
                author: 'Test Author',
                mid: 456,
                typeid: '1',
                typename: 'Test',
                arcurl: 'http://www.bilibili.com/video/av123',
                pic: '//example.com/pic.jpg',
                play: 1000,
                video_review: 10,
                favorites: 5,
                tag: 'test',
                review: 2,
                pubdate: 1234567890,
                senddate: 1234567890,
                duration: '2:00',
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
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.searchVideos('test query', 1);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://api.bilibili.com/x/web-interface/search/type',
        expect.objectContaining({
          params: {
            search_type: 'video',
            keyword: 'test query',
            page: 1,
            order: 'totalrank',
            duration: 0,
            tids: 0,
          },
          headers: expect.objectContaining({
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          }),
        })
      );
    });
  });
});
