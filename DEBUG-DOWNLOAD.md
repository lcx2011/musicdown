# 下载问题调试指南

## 当前状态

开发服务器已启动在: `http://localhost:5174/`

## 调试步骤

### 1. 打开应用并打开开发者工具

1. 应用应该会自动打开
2. 如果没有，手动访问 `http://localhost:5174/`
3. 按 F12 打开开发者工具

### 2. 测试搜索功能

1. 在搜索框输入关键词（例如："测试"）
2. 按 Enter 键
3. **检查 Console 标签页**，看是否有错误
4. **检查 Network 标签页**，看 API 请求状态

**预期结果**: 应该显示视频列表

### 3. 测试下载功能

1. 点击任意视频的"下载"按钮
2. **检查 Console 标签页**，看是否有错误
3. **检查 Network 标签页**，看 API 请求状态

**预期结果**: 
- 显示下载进度
- 下载完成后，桌面应该有视频文件

## 可能的错误和解决方案

### 错误 1: "window.electronAPI is undefined"

**原因**: Preload 脚本没有正确加载

**解决方案**:
1. 检查 `electron/main.ts` 中的 `contextIsolation` 设置
2. 当前设置是 `contextIsolation: false`，所以 preload 中的 `contextBridge` 不会执行

**修复**: 需要在 preload 脚本中添加非 contextIsolation 模式的支持

### 错误 2: "extractVideo is not a function"

**原因**: IPC 处理器没有正确注册

**解决方案**:
1. 检查 `electron/main.ts` 中是否有 `extract-video` 处理器
2. 检查 `setupIPCHandlers()` 是否被调用

### 错误 3: API 返回 400 错误

**原因**: Snapany API 的签名验证失败

**可能的原因**:
- `g-footer` 计算不正确
- `g-timestamp` 格式不正确
- 缺少必要的请求头

**临时解决方案**: 使用其他 Bilibili 视频提取 API

## 快速测试命令

### 测试 Snapany API（在 Node.js 环境）

```bash
npx tsx scripts/test-snapany-api.ts
```

### 检查 Electron 进程

在开发者工具的 Console 中运行：

```javascript
// 检查是否在 Electron 环境
console.log('Electron:', process.versions.electron);

// 检查 electronAPI 是否可用
console.log('electronAPI:', window.electronAPI);

// 如果可用，测试 extractVideo
if (window.electronAPI) {
  window.electronAPI.extractVideo('https://www.bilibili.com/video/BV1d88EzzEsm')
    .then(result => console.log('Extract result:', result))
    .catch(err => console.error('Extract error:', err));
}
```

## 当前配置检查

### 1. 检查 contextIsolation 设置

**文件**: `electron/main.ts`

```typescript
webPreferences: {
  nodeIntegration: true,
  contextIsolation: false,  // ← 这个设置很重要
  preload: path.join(__dirname, 'preload.js'),
}
```

**问题**: 当 `contextIsolation: false` 时，`contextBridge` 不会执行！

### 2. 检查 Preload 脚本

**文件**: `electron/preload.ts`

当前代码：
```typescript
if (process.contextIsolated) {
  // 只有在 contextIsolation: true 时才执行
  contextBridge.exposeInMainWorld('electronAPI', { ... });
}
```

**问题**: 因为 `contextIsolation: false`，所以这段代码不会执行！

## 紧急修复

需要修改 `electron/preload.ts`，支持 `contextIsolation: false` 模式：

```typescript
// 检查是否启用了 contextIsolation
if (process.contextIsolated) {
  // contextIsolation: true 模式
  const { contextBridge, ipcRenderer } = require('electron');
  contextBridge.exposeInMainWorld('electronAPI', { ... });
} else {
  // contextIsolation: false 模式
  // 直接在 window 上挂载
  const { ipcRenderer } = require('electron');
  (window as any).electronAPI = {
    extractVideo: async (videoUrl: string) => {
      return await ipcRenderer.invoke('extract-video', { videoUrl });
    },
    // ... 其他 API
  };
}
```

## 下一步

请告诉我：

1. **Console 中的具体错误信息**
2. **Network 标签页中的请求状态**
3. **是否看到 "window.electronAPI is undefined" 错误**

这样我可以提供更精确的修复方案。
