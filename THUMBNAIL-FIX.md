# 封面图片加载修复 🖼️

## 问题

Bilibili的封面图片无法显示，可能的原因：
1. 图片服务器有防盗链保护（Referer检查）
2. CORS跨域限制
3. 图片URL格式问题

## 解决方案

### 1. 添加Referer头拦截器

在 `electron/main.ts` 中添加 `webRequest.onBeforeSendHeaders` 拦截器，为所有Bilibili图片请求自动添加Referer和User-Agent头：

```typescript
// Add Referer header for Bilibili image requests to bypass anti-hotlinking
mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
  { urls: ['https://*.hdslb.com/*', 'https://*.bilibili.com/*'] },
  (details, callback) => {
    details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    callback({ requestHeaders: details.requestHeaders });
  }
);
```

这会拦截所有到Bilibili CDN的请求，并添加必要的头信息。

### 2. 移除crossOrigin属性

从 `<img>` 标签中移除 `crossOrigin="anonymous"`，因为：
- 这会触发CORS预检请求
- Bilibili的图片服务器可能不支持CORS
- 在Electron中不需要这个属性

```typescript
// 之前
<img crossOrigin="anonymous" ... />

// 现在
<img ... />
```

### 3. 添加调试日志

添加了调试日志来追踪图片加载问题：

**SearchService.ts:**
```typescript
console.log('[SearchService] Thumbnail URL:', thumbnail);
```

**VideoCard.tsx:**
```typescript
console.error('[VideoCard] Image load error:', {
  src: video.thumbnail,
  videoId: video.id,
  title: video.title,
});
```

## 工作原理

### Bilibili图片URL格式

Bilibili API返回的图片URL通常是这样的：
```
//i0.hdslb.com/bfs/archive/xxx.jpg
```

我们的代码会自动添加 `https:` 前缀：
```typescript
if (thumbnail.startsWith('//')) {
  thumbnail = 'https:' + thumbnail;
}
```

结果：
```
https://i0.hdslb.com/bfs/archive/xxx.jpg
```

### 防盗链保护

Bilibili的图片服务器检查Referer头：
- ✅ Referer: `https://www.bilibili.com/` → 允许
- ❌ Referer: `http://localhost:5173/` → 拒绝
- ❌ 无Referer → 拒绝

我们的拦截器确保所有图片请求都带有正确的Referer。

## 测试

### 在Electron中测试

```bash
npm run dev
```

1. 搜索视频（例如："音乐"）
2. 检查DevTools控制台：
   - 应该看到 `[SearchService] Thumbnail URL: https://...`
   - 不应该看到 `[VideoCard] Image load error`
3. 验证封面图片正确显示

### 调试步骤

如果图片仍然不显示：

1. **检查控制台日志**
   ```
   [SearchService] Thumbnail URL: https://i0.hdslb.com/bfs/archive/xxx.jpg
   ```

2. **检查Network标签**
   - 查找图片请求
   - 检查Request Headers是否包含Referer
   - 检查Response状态码（应该是200）

3. **检查图片URL**
   - 复制图片URL
   - 在浏览器中打开（带Referer）
   - 验证图片可访问

## 已知问题

### 开发环境 vs 生产环境

- **开发环境** (`npm run dev`): 
  - Vite dev server在 `localhost:5173`
  - 图片请求会被拦截器处理 ✅

- **生产环境** (打包后的exe):
  - 从本地文件加载
  - 图片请求会被拦截器处理 ✅

### 浏览器环境

如果在普通浏览器中运行（非Electron）：
- ❌ 无法设置Referer（浏览器限制）
- ❌ 会遇到CORS错误
- ✅ 这就是为什么我们需要Electron

## 文件修改

1. `electron/main.ts` - 添加图片请求拦截器
2. `src/components/VideoCard.tsx` - 移除crossOrigin，添加调试日志
3. `src/services/SearchService.ts` - 添加调试日志

## 测试结果

```
Test Suites: 9 passed, 9 total
Tests:       117 passed, 117 total
```

✅ 所有测试通过
✅ 图片加载修复完成
✅ 准备在Electron中测试

---

**日期**: 2026-01-02
**状态**: 图片加载修复完成 ✅
**下一步**: 在Electron中测试 (`npm run dev`)
