/**
 * Unit tests for SearchView component
 * Requirements: 1.1, 1.2, 10.2, 10.3
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchView } from './SearchView';

describe('SearchView', () => {
  const mockOnSearch = jest.fn();
  const mockOnSelectDirectory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full mode (initial search)', () => {
    it('should render search input on mount', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false} 
        />
      );

      const input = screen.getByPlaceholderText('输入关键词搜索视频...');
      expect(input).toBeInTheDocument();
    });

    it('should trigger search callback when Enter key is pressed', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false} 
        />
      );

      const input = screen.getByPlaceholderText('输入关键词搜索视频...');
      
      fireEvent.change(input, { target: { value: '测试视频' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockOnSearch).toHaveBeenCalledWith('测试视频');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('should not trigger search with empty query', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false} 
        />
      );

      const input = screen.getByPlaceholderText('输入关键词搜索视频...');
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should display loading state', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={true} 
        />
      );

      const input = screen.getByPlaceholderText('输入关键词搜索视频...');
      expect(input).toBeDisabled();
    });

    it('should render directory selection button when callback provided', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory="C:\\Users\\Test\\Desktop"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Desktop');
    });

    it('should trigger directory selection when button is clicked', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory="C:\\Users\\Test\\Desktop"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSelectDirectory).toHaveBeenCalledTimes(1);
    });

    it('should display "未设置" when no directory is set', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory=""
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('未设置');
    });

    it('should truncate long directory paths', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory="C:\\Users\\TestUser\\Documents\\Downloads\\Videos"
        />
      );

      const button = screen.getByRole('button');
      // Should show last 2 parts of path with truncation indicator
      expect(button.textContent).toContain('Videos');
      expect(button.textContent).toContain('...');
    });
  });

  describe('Compact mode', () => {
    it('should render compact search input', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          compact={true}
        />
      );

      const input = screen.getByPlaceholderText('搜索视频...');
      expect(input).toBeInTheDocument();
    });

    it('should trigger search on Enter in compact mode', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          compact={true}
        />
      );

      const input = screen.getByPlaceholderText('搜索视频...');
      
      fireEvent.change(input, { target: { value: '测试' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockOnSearch).toHaveBeenCalledWith('测试');
    });

    it('should render directory button in compact mode', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          compact={true}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory="C:\\Users\\Test\\Desktop"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle directory button click in compact mode', () => {
      render(
        <SearchView 
          onSearch={mockOnSearch} 
          isLoading={false}
          compact={true}
          onSelectDirectory={mockOnSelectDirectory}
          currentDirectory="C:\\Users\\Test\\Desktop"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSelectDirectory).toHaveBeenCalledTimes(1);
    });
  });
});
