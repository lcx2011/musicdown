# 🎯 立即测试 - 下载功能验证

## ✅ 应用已启动

Electron 应用现在正在运行，Vite 开发服务器在 `http://localhost:5173/`

## 📋 测试步骤

### 步骤 1: 打开开发者工具

在 Electron 窗口中按 **F12** 打开开发者工具

### 步骤 2: 检查 electronAPI

在 **Console** 标签页中运行：

```javascript
console.log('electronAPI:', window.electronAPI);
```

**预期结果**: 应该看到一个对象，包含以下方法：
- `extractVideo`
- `downloadVideo`
- `getDesktopPath`
- `saveFile`
- `checkDiskSpace`
- `onDownloadProgress`

### 步骤 3: 测试视频提取

在 Console 中运行：

```javascript
window.electronAPI.extractVideo('https://www.bilibili.com/video/BV1d88EzzEsm')
  .then(result => {
    console.log('✓ Extract Success:', result);
    if (result.success) {
      console.log('Title:', result.data.text);
      console.log('Media Count:', result.data.medias.length);
      console.log('Download URL:', result.data.medias[0].resource_url.substring(0, 100) + '...');
    } else {
      console.error('✗ Extract Failed:', result.error);
    }
  })
  .catch(err => console.error('✗ Exception:', err));
```

**预期结果**: 
- ✅ 如果成功：显示视频标题和下载链接
- ❌ 如果失败：显示错误信息（可能是 Snapany API 的问题）

### 步骤 4: 测试完整下载流程

#### 方法 A: 使用 UI

1. 在搜索框输入关键词（例如："测试"）
2. 按 Enter 键
3. 等待搜索结果显示
4. 点击任意视频的"下载"按钮
5. 观察：
   - 下载进度是否显示
   - Console 中是否有错误
   - 下载完成后，桌面是否有文件

#### 方法 B: 使用 Console

```javascript
// 1. 先提取视频信息
const videoUrl = 'https://www.bilibili.com/video/BV1d88EzzEsm';

window.electronAPI.extractVideo(videoUrl)
  .then(async (extractResult) => {
    if (!extractResult.success) {
      console.error('Extract failed:', extractResult.error);
      return;
    }
    
    console.log('✓ Extract success');
    
    // 2. 获取下载链接
    const downloadUrl = extractResult.data.medias[0].resource_url;
    console.log('Download URL:', downloadUrl.substring(0, 100) + '...');
    
    // 3. 下载视频
    console.log('Starting download...');
    const downloadResult = await window.electronAPI.downloadVideo(downloadUrl, false);
    
    if (downloadResult.success) {
      const sizeMB = (downloadResult.size / 1024 / 1024).toFixed(2);
      console.log(`✓ Download success! Size: ${sizeMB} MB`);
      
      // 4. 保存到桌面
      const desktopResult = await window.electronAPI.getDesktopPath();
      if (desktopResult.success) {
        const filename = 'test-video.mp4';
        const filepath = desktopResult.path + '\\' + filename;
        
        console.log('Saving to:', filepath);
        const saveResult = await window.electronAPI.saveFile(filepath, Buffer.from(downloadResult.data));
        
        if (saveResult.success) {
          console.log('✓ File saved successfully!');
          console.log('Check your desktop for:', filename);
        } else {
          console.error('✗ Save failed:', saveResult.error);
        }
      }
    } else {
      console.error('✗ Download failed:', downloadResult.error);
    }
  })
  .catch(err => console.error('✗ Exception:', err));
```

## 🔍 可能的结果

### 结果 1: electronAPI 未定义 ❌

**Console 输出**:
```
electronAPI: undefined
```

**原因**: Preload 脚本没有正确加载

**解决方案**:
1. 检查 Console 中是否有 "Preload script loaded" 消息
2. 重启应用
3. 如果还是不行，告诉我详细的错误信息

### 结果 2: extractVideo 返回 400 错误 ❌

**Console 输出**:
```
✗ Extract Failed: Illegal request. Please refresh the page and try again
```

**原因**: Snapany API 的反爬虫机制

**解决方案**: 这是 API 的问题，不是代码的问题。可能的解决方案：
1. 使用其他 Bilibili 视频提取 API
2. 使用本地工具（you-get, yt-dlp）
3. 直接使用 Bilibili 官方 API（需要认证）

### 结果 3: 下载成功 ✅

**Console 输出**:
```
✓ Extract success
✓ Download success! Size: 5.23 MB
✓ File saved successfully!
Check your desktop for: test-video.mp4
```

**验证**: 检查桌面是否有 `test-video.mp4` 文件

## 📊 诊断信息

请告诉我以下信息：

### 1. electronAPI 状态
```javascript
console.log('electronAPI:', window.electronAPI);
```
结果: _______________

### 2. Preload 日志
在 Console 中查找：
```
Bilibili Downloader - Preload script loaded
Context Isolation: false
Node Integration: enabled
electronAPI available: true
```
是否看到这些日志？ _______________

### 3. 视频提取结果
运行步骤 3 的代码，结果是什么？
- ✅ 成功
- ❌ 失败（错误信息：_______________）

### 4. 下载结果
如果提取成功，下载结果是什么？
- ✅ 成功（文件大小：_______________ MB）
- ❌ 失败（错误信息：_______________）

## 🎯 下一步

根据测试结果：

### 如果 electronAPI 可用且提取成功
→ 问题已解决！可以正常使用下载功能

### 如果 electronAPI 可用但提取失败（400 错误）
→ 需要更换 API 或使用其他方法

### 如果 electronAPI 未定义
→ 需要进一步调试 Preload 脚本

请告诉我测试结果，我会根据情况提供下一步的解决方案！
