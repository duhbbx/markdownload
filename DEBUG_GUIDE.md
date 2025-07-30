# MarkDownload 调试指南

我已经在扩展的关键位置添加了详细的调试日志，帮助诊断问题。

## 🔍 如何查看日志

### 1. 查看 Background 脚本日志
1. 打开 `chrome://extensions/`
2. 找到 MarkDownload 扩展
3. 点击"详细信息"
4. 点击"检查视图: Service Worker"
5. 在打开的开发者工具中查看 Console 标签

### 2. 查看 Popup 脚本日志  
1. 右键点击扩展图标
2. 选择"检查弹出式窗口"
3. 在打开的开发者工具中查看 Console 标签

### 3. 查看页面内容脚本日志
1. 在目标网页上按 F12 打开开发者工具
2. 查看 Console 标签

## 📋 日志标识说明

- `🔧 [MarkDownload]` - 正常执行流程
- `❌ [MarkDownload]` - 错误信息  
- `⚠️ [MarkDownload]` - 警告信息

## 🎯 关键执行流程

点击扩展图标后，正常的日志流程应该是：

### Popup 脚本 (右键检查弹出式窗口)
```
🔧 [MarkDownload] Popup script loaded
🔧 [MarkDownload] Getting default options...
🔧 [MarkDownload] Got options: {...}
🔧 [MarkDownload] Querying active tab...
🔧 [MarkDownload] Found tabs: [...]
🔧 [MarkDownload] Active tab ID: 123 URL: https://...
🔧 [MarkDownload] Injecting browser-polyfill.min.js...
```

### Background 脚本 (检查视图: Service Worker)
```
🔧 [MarkDownload] Background script loaded
🔧 [MarkDownload] Platform info: {...}
🔧 [MarkDownload] Setting up message listeners...
🔧 [MarkDownload] Creating context menus...
🔧 [MarkDownload] Background: Received message: executeScript
```

### 如果一切正常
最终应该看到：
```
🔧 [MarkDownload] Popup: notify called with message: display.md
🔧 [MarkDownload] Popup: UI setup complete
```

## 🚨 常见问题诊断

### 1. 点击图标没反应
检查 Popup 日志是否有：
- `🔧 [MarkDownload] Popup script loaded` 
- 如果没有，说明 popup.html 或 popup.js 加载失败

### 2. 脚本注入失败
查看是否有：
- `❌ [MarkDownload] Script injection failed`
- 可能原因：权限不足、页面不支持、CSP限制

### 3. 内容获取失败
查看是否有：
- `⚠️ [MarkDownload] No result from getSelectionAndDom()`
- 可能原因：内容脚本未正确加载或页面内容无法解析

### 4. Manifest V3 API 问题
查看是否有：
- `❌ [MarkDownload] MV3 Adapter: Script execution failed`
- 可能原因：权限配置问题或API兼容性问题

## 🛠️ 故障排除步骤

1. **重新加载扩展**
   - 在 `chrome://extensions/` 中点击"重新加载"
   
2. **检查权限**
   - 确保扩展有访问当前网站的权限
   
3. **测试不同网站**
   - 在简单的网页（如 Wikipedia）上测试
   
4. **清除扩展数据**
   - 在扩展详情页面点击"清除存储空间"

## 📤 报告问题

如果发现问题，请提供：
1. 完整的控制台日志（Background 和 Popup）
2. 浏览器版本和操作系统
3. 出现问题的网站URL
4. 具体的操作步骤

这些日志将帮助快速定位和解决问题！ 