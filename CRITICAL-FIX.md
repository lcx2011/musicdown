# 🚨 关键修复 - Preload 脚本问题

## 问题根源

**发现的问题**: `electron/preload.ts` 只在 `contextIsolation: true` 时才暴露 API，但当前配置是 `contextIsolation: false`，导致 `window.electronAPI` 未定义。

## ✅ 已修复

更新了 `electron/preload.ts`，现在支持两种模式：

```typescript
// 创建 API 对象
const electronAPI = { ... };

// 根据 contextIsolation 设置选择暴露方式
if (process.contextIsolated) {
  // contextIsolation: true - 使用 contextBridge
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} else {
  // contextIsolation: false - 直接挂载到 window
  window.electronAPI = electronAPI;
}
```

## 🧪 测试步骤

### 方法 1: 使用测试页面

1. **启动开发服务器**:
   ```bash
   npm run dev
   ```

2. **在 Electron 窗口中打开测试页面**:
   - 应用启动后，在地址栏输入: `file:///${当前目录}/test-electron-api.html`
   - 或者修改 `electron/main.ts` 临时加载测试页面

3. **运行测试**:
   - 点击"检查环境"按钮
   - 应该看到 `electronAPI available: true`
   - 点击"提取视频信息"按钮
   - 应该看到视频标题和下载链接

### 方法 2: 在开发者工具中测试

1. **启动应用**: `npm run dev`

2. **打开开发者工具**: F12

3. **在 Console 中运行**:

```javascript
// 1. 检查 electronAPI 是否可用
console.log('electronAPI:', window.electronAPI);

// 2. 测试视频提取
window.electronAPI.extractVideo('https://www.bilibili.com/video/BV1d88EzzEsm')
  .then(result => {
    console.log('Extract result:', result);
    if (result.success) {
      console.log('Title:', result.data.text);
      console.log('Download URL:', result.data.medias[0].resource_url);
    }
  })
  .catch(err => console.error('Error:', err));
```

## 📋 完整的调试清单

### ✅ 检查项 1: Preload 脚本加载
在 Console 中应该看到:
```
Bilibili Downloader - Preload script loaded
Context Isolation: false
Node Integration: enabled
electronAPI available: true
```

### ✅ 检查项 2: IPC 处理器注册
在主进程日志中应该看到 IPC 处理器被注册（如果有日志的话）

### ✅ 检查项 3: API 调用
```javascript
// 应该返回成功结果
await window.electronAPI.extractVideo('https://www.bilibili.com/video/BV1d88EzzEsm')
```

## 🔧 如果仍然失败

### 问题 A: electronAPI 仍然未定义

**可能原因**: Preload 脚本没有加载

**解决方案**:
1. 检查 `electron/main.ts` 中的 preload 路径:
   ```typescript
   preload: path.join(__dirname, 'preload.js')
   ```

2. 确保 preload.js 文件存在于 `dist-electron` 目录

3. 重新构建: `npm run build`

### 问题 B: API 调用返回错误

**可能原因**: Snapany API 签名验证失败

**临时解决方案**: 使用其他 Bilibili 视频提取服务

**替代 API**:
1. **you-get** (需要本地安装)
2. **yt-dlp** (需要本地安装)
3. **其他第三方 Bilibili API 服务**

### 问题 C: 视频下载失败

**可能原因**: 
- CDN 链接过期
- 网络连接问题
- 缺少必要的请求头

**解决方案**:
1. 确保提取后立即下载
2. 检查网络连接
3. 查看 Console 中的详细错误信息

## 🎯 下一步行动

1. **重启开发服务器** (如果还在运行):
   ```bash
   # 停止当前服务器 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

2. **打开开发者工具** (F12)

3. **在 Console 中运行**:
   ```javascript
   console.log('electronAPI:', window.electronAPI);
   ```

4. **如果看到 electronAPI 对象**, 尝试下载:
   - 搜索视频
   - 点击下载按钮
   - 查看 Console 中的错误信息

5. **告诉我**:
   - `window.electronAPI` 是否存在？
   - Console 中有什么错误信息？
   - 下载按钮点击后发生了什么？

## 📞 需要的信息

请提供以下信息以便进一步诊断:

1. **Console 输出**:
   ```javascript
   console.log('electronAPI:', window.electronAPI);
   ```

2. **Preload 日志**: 应该在 Console 中看到 "Preload script loaded"

3. **错误信息**: 任何红色的错误信息

4. **Network 标签页**: API 请求的状态码和响应

有了这些信息，我可以提供更精确的解决方案！
