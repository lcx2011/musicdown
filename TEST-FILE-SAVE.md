# 测试文件保存功能

## 问题修复
已修复 `os.homedir is not a function` 错误。所有文件系统操作现在都通过 IPC 完成。

## 修复内容
1. ✅ 添加了 `file-exists` IPC 处理器到 `electron/main.ts`
2. ✅ 更新了 `FileSystemManager.ts` 中的 `fileExists()` 方法使用 IPC
3. ✅ 更新了 `getUniqueFilename()` 方法使用 IPC 检查文件存在
4. ✅ 在 `electron/preload.ts` 中暴露了 `fileExists` API
5. ✅ 在 `src/vite-env.d.ts` 中添加了类型定义

## 测试步骤

### 1. 打开开发者工具控制台
应用已经在运行中 (ProcessId: 8)

### 2. 运行完整的下载测试
在控制台中粘贴并运行以下代码：

```javascript
// 完整的下载流程测试
async function testCompleteDownload() {
  try {
    console.log('🔍 Step 1: Extracting video info...');
    const extractResult = await window.electronAPI.extractVideo('https://www.bilibili.com/video/BV1d88EzzEsm');
    
    if (!extractResult.success) {
      console.error('❌ Extract failed:', extractResult.error);
      return;
    }
    
    console.log('✅ Extract success');
    console.log('📹 Title:', extractResult.data.text);
    
    const downloadUrl = extractResult.data.medias[0].resource_url;
    console.log('🔗 Download URL:', downloadUrl.substring(0, 80) + '...');
    
    console.log('\n🔽 Step 2: Downloading video...');
    const downloadResult = await window.electronAPI.downloadVideo(downloadUrl, false);
    
    if (!downloadResult.success) {
      console.error('❌ Download failed:', downloadResult.error);
      return;
    }
    
    console.log('✅ Download success');
    console.log('📦 Size:', (downloadResult.size / 1024 / 1024).toFixed(2), 'MB');
    
    console.log('\n💾 Step 3: Saving file to desktop...');
    const desktopResult = await window.electronAPI.getDesktopPath();
    
    if (!desktopResult.success) {
      console.error('❌ Failed to get desktop path:', desktopResult.error);
      return;
    }
    
    console.log('📁 Desktop path:', desktopResult.path);
    
    const filepath = desktopResult.path + '\\bilibili-test-' + Date.now() + '.mp4';
    console.log('💾 Saving to:', filepath);
    
    const saveResult = await window.electronAPI.saveFile(filepath, Buffer.from(downloadResult.data));
    
    if (!saveResult.success) {
      console.error('❌ Save failed:', saveResult.error);
      return;
    }
    
    console.log('✅ Save success!');
    console.log('📄 File saved to:', saveResult.path);
    console.log('\n🎉 Complete download flow SUCCESS! Check your desktop for the video file.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// 运行测试
testCompleteDownload();
```

### 3. 预期结果
如果一切正常，你应该看到：
```
🔍 Step 1: Extracting video info...
✅ Extract success
📹 Title: 【混声教学】挑战蔡徐坤的《Deadman》，讲一下头声训练的误区以及混声唱法在实战中的运用！

🔽 Step 2: Downloading video...
✅ Download success
📦 Size: XX.XX MB

💾 Step 3: Saving file to desktop...
📁 Desktop path: C:\Users\...\Desktop
💾 Saving to: C:\Users\...\Desktop\bilibili-test-XXXXXXXXXX.mp4
✅ Save success!
📄 File saved to: C:\Users\...\Desktop\bilibili-test-XXXXXXXXXX.mp4

🎉 Complete download flow SUCCESS! Check your desktop for the video file.
```

### 4. 验证文件
检查你的桌面，应该有一个名为 `bilibili-test-XXXXXXXXXX.mp4` 的视频文件。

## 如果测试成功
1. 尝试在 UI 中搜索视频并点击下载按钮
2. 验证完整的用户界面下载流程是否正常工作
3. 如果一切正常，任务 17 可以标记为完成 ✅

## 如果仍然失败
请复制完整的错误信息，我会继续调查问题。
