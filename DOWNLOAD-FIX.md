# 视频下载功能修复

## 问题描述

原有的下载实现直接在渲染进程（浏览器环境）中使用 axios 下载 Bilibili 视频，但遇到以下问题：

1. **CORS 限制** - Bilibili CDN 的跨域策略阻止了浏览器直接访问
2. **不安全的请求头** - 浏览器不允许设置 `Referer` 等"不安全"的请求头
3. **防盗链机制** - Bilibili 要求特定的 Referer 头才能下载视频

## 解决方案

通过 Electron 的 IPC（进程间通信）机制，将视频下载移到主进程处理：

### 1. 主进程 IPC 处理器 (`electron/main.ts`)

添加了 `download-video` IPC 处理器，在主进程中使用 axios 下载视频：

```typescript
ipcMain.handle('download-video', async (_event, { url, onProgress }) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 ...',
      'Referer': 'https://www.bilibili.com/',
      'Accept': '*/*',
      'Origin': 'https://www.bilibili.com',
    },
    onDownloadProgress: (progressEvent) => {
      // 发送进度更新到渲染进程
      mainWindow.webContents.send('download-progress', {...});
    },
  });
  
  return { success: true, data: response.data };
});
```

### 2. Preload 脚本 (`electron/preload.ts`)

暴露下载 API 给渲染进程：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  downloadVideo: async (url: string, onProgress?: boolean) => {
    return await ipcRenderer.invoke('download-video', { url, onProgress });
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
  },
});
```

### 3. 类型定义 (`src/vite-env.d.ts`)

添加 TypeScript 类型定义：

```typescript
interface ElectronAPI {
  downloadVideo: (url: string, onProgress?: boolean) => Promise<{
    success: boolean;
    data?: ArrayBuffer;
    size?: number;
    error?: string;
  }>;
  onDownloadProgress: (callback: (progress: {...}) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

### 4. 下载服务更新 (`src/services/DownloadService.ts`)

修改下载逻辑，优先使用 Electron IPC：

```typescript
// 使用 Electron IPC 下载（绕过 CORS）
if (typeof window !== 'undefined' && window.electronAPI) {
  const result = await window.electronAPI.downloadVideo(downloadUrl, true);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Download failed');
  }
  
  videoBuffer = Buffer.from(result.data);
} else {
  // 降级到 axios（可能因 CORS 失败）
  const response = await axios.get(downloadUrl, {...});
  videoBuffer = Buffer.from(response.data);
}
```

## 优势

1. **绕过 CORS** - 主进程不受浏览器安全限制
2. **完整的请求头控制** - 可以设置任何需要的 HTTP 头
3. **更好的错误处理** - 主进程可以捕获更详细的网络错误
4. **进度跟踪** - 通过 IPC 事件实时更新下载进度
5. **向后兼容** - 保留 axios 降级方案

## API 响应格式

从你提供的 API 响应来看：

```json
{
  "text": "视频标题",
  "medias": [{
    "media_type": "video",
    "resource_url": "https://cn-lndl-ct-01-03.bilivideo.com/...",
    "preview_url": "http://i2.hdslb.com/bfs/archive/..."
  }],
  "overseas": 0
}
```

`resource_url` 是带签名的 CDN 链接，包含：
- `deadline` - 链接过期时间
- `upsig` - 签名参数
- 其他 CDN 参数

## 测试

运行测试脚本验证下载功能：

```bash
npx tsx scripts/test-download.ts
```

或在 Electron 应用中测试：

```bash
npm run dev
```

## 注意事项

1. **链接时效性** - API 返回的 `resource_url` 有时效限制（`deadline` 参数）
2. **请求头必需** - 必须包含正确的 `Referer` 和 `User-Agent`
3. **网络环境** - 确保能访问 Bilibili CDN（某些网络可能被限制）

## 相关文件

- `electron/main.ts` - 主进程 IPC 处理器
- `electron/preload.ts` - Preload 脚本
- `src/vite-env.d.ts` - TypeScript 类型定义
- `src/services/DownloadService.ts` - 下载服务实现
- `scripts/test-download.ts` - 下载测试脚本
