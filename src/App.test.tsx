import { render } from '@testing-library/react';
import App from './App';
import { AppProvider } from './context/AppContext';

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

describe('App', () => {
  it('renders the application', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    // App should render without crashing
    expect(document.body).toBeInTheDocument();
  });
});
