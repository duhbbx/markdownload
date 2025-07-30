# Chrome 安装指南

此扩展已升级到 Manifest V3，现在可以在 Google Chrome 中正常安装和使用了。

## 安装步骤

### 方法一：开发者模式安装（推荐用于测试）

1. **打开Chrome扩展页面**
   - 在Chrome地址栏输入 `chrome://extensions/`
   - 或者点击 Chrome 菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 在扩展页面右上角，打开"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"按钮
   - 选择项目的 `src/` 目录
   - 点击"选择文件夹"

4. **确认安装**
   - 扩展应该会出现在扩展列表中
   - 确保扩展已启用（开关是蓝色的）

### 方法二：Chrome Web Store 安装

从官方商店安装：[MarkDownload - Markdown Web Clipper](https://chrome.google.com/webstore/detail/markdownload-markdown-web/pcmpcfapbekmbjjkdalcgopdkipoggdi)

## 主要升级内容

✅ **Manifest V3 兼容性**
- 升级到 manifest_version: 3
- 更新权限配置
- 后台脚本改为 service worker

✅ **API 兼容性**
- 修复 browser_action → action
- 更新 background 脚本加载方式
- 添加 scripting 权限

✅ **向后兼容**
- 保持所有原有功能
- 支持所有现有快捷键
- 兼容 Firefox 和其他浏览器

## 使用方法

1. **基本使用**
   - 在任意网页点击扩展图标
   - 在弹出窗口中预览和编辑 Markdown
   - 点击下载按钮保存文件

2. **快捷键**
   - `Alt+Shift+M`: 打开扩展
   - `Alt+Shift+D`: 直接下载当前页面
   - `Alt+Shift+C`: 复制为 Markdown
   - `Alt+Shift+L`: 复制页面链接

3. **右键菜单**
   - 右键点击页面或选中文本
   - 选择 MarkDownload 相关选项

## 故障排除

如果遇到问题：

1. **扩展无法加载**
   - 确保选择的是 `src/` 目录，不是根目录
   - 检查开发者模式是否已启用

2. **功能不正常**
   - 刷新浏览器页面
   - 重新加载扩展
   - 检查浏览器控制台是否有错误信息

3. **权限问题**
   - 确保扩展有访问网站的权限
   - 在扩展详情页面检查权限设置

## 反馈

如果遇到任何问题或有改进建议，请在项目的 GitHub 页面提交 issue。 