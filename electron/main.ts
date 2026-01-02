import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 * Requirements: 7.1, 6.1
 */
function createWindow() {
  // Disable the default menu bar
  // Requirements: 7.1
  Menu.setApplicationMenu(null);

  // Configure window with system frame
  // Requirements: 7.1
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true, // Use system window frame with standard controls
    transparent: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      // Enable nodeIntegration for file system access
      // Requirements: 6.1
      // Note: nodeIntegration is enabled as per requirements for direct file system access
      // IPC handlers are also provided as an alternative secure approach
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      // Configure CSP for security
      // Requirements: 7.1
      webSecurity: true,
    },
  });

  // Set Content Security Policy
  // Requirements: 7.1
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
          "style-src 'self' 'unsafe-inline' http://localhost:*; " +
          "img-src 'self' data: https: http:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  // Add Referer header for Bilibili image requests to bypass anti-hotlinking
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['https://*.hdslb.com/*', 'https://*.bilibili.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      callback({ requestHeaders: details.requestHeaders });
    }
  );
  
  // Load the app
  // In development, load from Vite dev server
  // In production, load from packaged files
  const devServerUrl = 'http://localhost:5173';
  
  // Check if we're in development or production
  // app.isPackaged is more reliable than NODE_ENV
  if (!app.isPackaged) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
    console.log('Loaded from Vite dev server:', devServerUrl);
  } else {
    // Production: load from packaged files
    // __dirname is dist-electron/electron, so we need to go up two levels
    const indexPath = path.join(__dirname, '../../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Set up IPC handlers for file operations and API requests
 * Requirements: 4.4, 9.3
 */
function setupIPCHandlers() {
  /**
   * IPC handler for video extraction API
   * This runs in the main process to handle the Bilibili video extraction
   * 
   * Alternative approach: Use Bilibili's official playurl API
   */
  ipcMain.handle('extract-video', async (_event, { videoUrl }: { videoUrl: string }) => {
    try {
      // Extract BV ID from URL
      const bvMatch = videoUrl.match(/BV[a-zA-Z0-9]+/);
      if (!bvMatch) {
        return { success: false, error: 'Invalid Bilibili video URL' };
      }
      
      const bvid = bvMatch[0];
      
      // Step 1: Get video info to get aid (av number)
      const infoResponse = await axios.get(`https://api.bilibili.com/x/web-interface/view`, {
        params: { bvid },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.bilibili.com/',
        },
      });
      
      if (infoResponse.data.code !== 0) {
        return { 
          success: false, 
          error: infoResponse.data.message || 'Failed to get video info' 
        };
      }
      
      const videoData = infoResponse.data.data;
      const aid = videoData.aid;
      const cid = videoData.cid;
      const title = videoData.title;
      const pic = videoData.pic;
      
      // Step 2: Get video playurl
      const playurlResponse = await axios.get(`https://api.bilibili.com/x/player/playurl`, {
        params: {
          avid: aid,
          cid: cid,
          qn: 80, // Quality: 80 = 1080P, 64 = 720P, 32 = 480P, 16 = 360P
          fnval: 0, // 0 = MP4, 1 = DASH
          fnver: 0,
          fourk: 1,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://www.bilibili.com/video/${bvid}`,
        },
      });
      
      if (playurlResponse.data.code !== 0) {
        return { 
          success: false, 
          error: playurlResponse.data.message || 'Failed to get playurl' 
        };
      }
      
      const durl = playurlResponse.data.data.durl;
      if (!durl || durl.length === 0) {
        return { 
          success: false, 
          error: 'No download URL available' 
        };
      }
      
      // Format response to match expected structure
      const response = {
        text: title,
        medias: durl.map((item: any) => ({
          media_type: 'video',
          resource_url: item.url,
          preview_url: pic.startsWith('//') ? 'https:' + pic : pic,
        })),
        overseas: 0,
      };
      
      return { success: true, data: response };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        statusCode: error.response?.status,
        data: error.response?.data
      };
    }
  });

  /**
   * IPC handler for Bilibili API search requests
   * This runs in the main process where we can set any headers we want
   */
  ipcMain.handle('bilibili-search', async (_event, { keyword, page }: { keyword: string; page: number }) => {
    try {
      const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
        params: {
          search_type: 'video',
          keyword: keyword,
          page: page,
          order: 'totalrank',
          duration: 0,
          tids: 0,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.bilibili.com',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        statusCode: error.response?.status,
        data: error.response?.data
      };
    }
  });

  /**
   * IPC handler for video download from Bilibili CDN
   * This runs in the main process to bypass CORS and set required headers
   */
  ipcMain.handle('download-video', async (_event, { url, onProgress }: { url: string; onProgress?: boolean }) => {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.bilibili.com/',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Origin': 'https://www.bilibili.com',
        },
        onDownloadProgress: onProgress ? (progressEvent) => {
          const total = progressEvent.total || 0;
          const loaded = progressEvent.loaded || 0;
          const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
          
          // Send progress updates to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-progress', {
              url,
              loaded,
              total,
              percentage,
            });
          }
        } : undefined,
      });
      
      return { 
        success: true, 
        data: response.data,
        size: response.data.byteLength 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        statusCode: error.response?.status,
      };
    }
  });

  /**
   * IPC handler for opening URLs in external browser
   * Requirements: 3.1, 3.4
   */
  ipcMain.handle('open-external', async (_event, { url }: { url: string }) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  /**
   * IPC handler for desktop path resolution
   * Requirements: 4.4
   * Returns the full path to the Windows desktop directory
   */
  ipcMain.handle('get-desktop-path', async () => {
    try {
      const homeDir = os.homedir();
      const desktopPath = path.join(homeDir, 'Desktop');
      return { success: true, path: desktopPath };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  /**
   * IPC handler for file saving
   * Requirements: 4.4
   * Saves a file to the specified path
   */
  ipcMain.handle('save-file', async (_event, { filepath, data }: { filepath: string; data: Buffer }) => {
    try {
      // Convert data to Buffer if it's not already
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      // Write the file to disk
      await fs.promises.writeFile(filepath, buffer);
      
      // Verify the file was written successfully
      const exists = fs.existsSync(filepath);
      if (!exists) {
        throw new Error('File verification failed: file does not exist after write');
      }
      
      // Verify the file size matches
      const stats = await fs.promises.stat(filepath);
      if (stats.size !== buffer.length) {
        throw new Error(`File verification failed: expected ${buffer.length} bytes, got ${stats.size} bytes`);
      }
      
      return { success: true, path: filepath };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  /**
   * IPC handler for disk space checking
   * Requirements: 9.3
   * Checks if there is sufficient disk space available
   */
  ipcMain.handle('check-disk-space', async (_event, { path: checkPath, requiredBytes }: { path: string; requiredBytes: number }) => {
    try {
      // For Windows, check available space on the drive
      // Note: Node.js doesn't have a built-in cross-platform way to check disk space
      // For Windows 7 compatibility, we'll use a simple approach
      
      const stats = fs.statfsSync ? fs.statfsSync(checkPath) : null;
      
      if (stats) {
        const availableBytes = stats.bavail * stats.bsize;
        const hasSpace = availableBytes >= requiredBytes;
        return { 
          success: true, 
          hasSpace, 
          availableBytes,
          requiredBytes 
        };
      }
      
      // Fallback: assume space is available if we can't check
      // This is safer than blocking downloads on older systems
      return { 
        success: true, 
        hasSpace: true, 
        availableBytes: -1,
        requiredBytes 
      };
    } catch (error) {
      // If we can't check disk space, assume it's available
      // This prevents blocking downloads on systems where the check fails
      return { 
        success: true, 
        hasSpace: true, 
        availableBytes: -1,
        requiredBytes,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  /**
   * IPC handler for checking file existence
   * Requirements: 4.4
   * Checks if a file exists at the specified path
   */
  ipcMain.handle('file-exists', async (_event, { filepath }: { filepath: string }) => {
    try {
      const exists = fs.existsSync(filepath);
      return { success: true, exists };
    } catch (error) {
      return { 
        success: false, 
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
}

app.whenReady().then(() => {
  // Set up IPC handlers before creating window
  setupIPCHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
