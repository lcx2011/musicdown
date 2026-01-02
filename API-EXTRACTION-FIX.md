# 视频提取 API 修复

## 问题描述

视频下载失败的根本原因是视频提取 API 调用失败：

1. **错误的 API 地址** - `.env` 文件中使用的是示例地址 `https://api.example.com`
2. **API 反爬虫机制** - Snapany API 有严格的请求验证，需要特定的头部和签名
3. **CORS 限制** - 渲染进程无法直接调用第三方 API

## 解决方案

### 1. 更新 API 配置

更新 `.env` 文件，使用正确的 Snapany API 地址：

```env
VITE_API_BASE_URL=https://api.snapany.com/v1
```

### 2. 通过 IPC 调用视频提取 API

将视频提取 API 调用移到 Electron 主进程：

#### 主进程 IPC 处理器 (`electron/main.ts`)

```typescript
ipcMain.handle('extract-video', async (_event, { videoUrl }) => {
  try {
    const timestamp = Date.now().toString();
    const requestData = { link: videoUrl };
    const dataString = JSON.stringify(requestData);
    
    // Generate g-footer hash
    const crypto = require('crypto');
    const footer = crypto.createHash('md5')
      .update(dataString + timestamp)
      .digest('hex');
    
    const response = await axios.post(
      'https://api.snapany.com/v1/extract',
      requestData,
      {
        headers: {
          'accept': '*/*',
          'accept-language': 'zh',
          'content-type': 'application/json',
          'g-footer': footer,
          'g-timestamp': timestamp,
          'origin': 'https://snapany.com',
          'referer': 'https://snapany.com/',
          'user-agent': 'Mozilla/5.0 ...',
        },
      }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

#### Preload 脚本 (`electron/preload.ts`)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  extractVideo: async (videoUrl: string) => {
    return await ipcRenderer.invoke('extract-video', { videoUrl });
  },
  // ... 其他 API
});
```

#### 类型定义 (`src/vite-env.d.ts`)

```typescript
export interface ElectronAPI {
  extractVideo: (videoUrl: string) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  // ... 其他 API
}
```

### 3. 更新 APIClient

修改 `extractVideo` 方法，优先使用 Electron IPC：

```typescript
async extractVideo(videoLink: string): Promise<ExtractionResponse> {
  const isElectron = typeof process !== 'undefined' && 
                     process.versions?.electron != null;
  
  if (isElectron && window.electronAPI) {
    // 使用 IPC 调用主进程
    const result = await window.electronAPI.extractVideo(videoLink);
    
    if (!result.success) {
      throw new APIError(result.error || 'Extraction failed');
    }
    
    return this.parseExtractionResponse(result.data);
  } else {
    // 降级到直接 HTTP 请求
    // ...
  }
}
```

## API 请求格式

### 请求

```http
POST https://api.snapany.com/v1/extract
Content-Type: application/json
g-footer: <MD5 hash>
g-timestamp: <Unix timestamp in milliseconds>
origin: https://snapany.com
referer: https://snapany.com/

{
  "link": "https://www.bilibili.com/video/BV1d88EzzEsm"
}
```

### 响应

```json
{
  "text": "视频标题",
  "medias": [
    {
      "media_type": "video",
      "resource_url": "https://cn-lndl-ct-01-03.bilivideo.com/...",
      "preview_url": "http://i2.hdslb.com/bfs/archive/..."
    }
  ],
  "overseas": 0
}
```

## 完整的下载流程

1. **用户点击下载按钮**
2. **调用 DownloadService.downloadVideo()**
3. **调用 APIClient.extractVideo()** - 通过 IPC 在主进程中请求 Snapany API
4. **获取 resource_url** - 从 API 响应中提取视频下载链接
5. **下载视频文件** - 通过 IPC 在主进程中下载（绕过 CORS）
6. **保存到桌面** - 使用 FileSystemManager 保存文件

## 优势

1. **绕过 CORS** - 主进程不受浏览器安全限制
2. **完整的头部控制** - 可以设置任何需要的 HTTP 头
3. **统一的 IPC 架构** - 所有外部 API 调用都通过主进程
4. **更好的错误处理** - 主进程可以捕获详细的网络错误
5. **向后兼容** - 保留直接 HTTP 请求作为降级方案

## 测试

### 测试 API 提取

运行测试脚本：

```bash
npx tsx scripts/test-snapany-api.ts
```

### 在 Electron 中测试

```bash
npm run dev
```

然后：
1. 搜索视频
2. 点击下载按钮
3. 检查桌面是否有下载的文件

## 注意事项

1. **API 限制** - Snapany API 可能有速率限制
2. **链接时效** - 返回的 `resource_url` 有时效限制
3. **网络环境** - 确保能访问 Snapany 和 Bilibili CDN
4. **签名算法** - 当前使用简单的 MD5 哈希，如果 API 更改签名算法需要更新

## 相关文件

- `electron/main.ts` - 主进程 IPC 处理器
- `electron/preload.ts` - Preload 脚本
- `src/vite-env.d.ts` - TypeScript 类型定义
- `src/services/APIClient.ts` - API 客户端实现
- `src/services/DownloadService.ts` - 下载服务
- `.env` - 环境配置
- `scripts/test-snapany-api.ts` - API 测试脚本
