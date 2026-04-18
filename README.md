# 🔥 KeyHeat Map

一款跨平台键盘/鼠标热力图桌面应用，专为程序员和游戏玩家设计。

使用 **Tauri** 构建，占用资源极小，界面美观，功能全面。

## ✨ 功能特性

### 🎹 键盘热力图
- 实时记录每一次按键
- SVG 矢量键盘布局可视化
- 多种配色方案（霓虹/暖色/冷色/单色）
- 悬停查看按键详细统计

### 📊 数据分析
- 今日/本周/本月/全部时间范围统计
- 按键趋势折线图
- 按键分布饼图
- 24小时活跃度热力分布
- 鼠标移动热力图
- 详细按键排行榜

### 🖼️ 分享海报
- 电竞炫酷风模板
- 极简数据风模板
- GitHub 贡献风模板
- 一键导出 PNG 图片

### ⚙️ 系统功能
- 系统托盘常驻
- 开机自启动
- 数据导出（JSON/CSV）
- 多键盘布局支持（60%/75%/全尺寸）

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Rust (Tauri v1) |
| 数据库 | SQLite (rusqlite) |
| 图表 | Recharts |
| 动画 | Framer Motion |
| 图标 | Lucide React |

## 📦 安装

### 从 Release 下载
前往 [Releases](https://github.com/laishouchao/keyheat-map/releases) 页面下载对应平台的安装包。

### 从源码编译

**前置要求：**
- Node.js >= 18
- Rust >= 1.75
- 平台依赖：
  - **Ubuntu/Debian**: `sudo apt install libwebkit2gtk-4.0-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
  - **macOS**: `xcode-select --install`
  - **Windows**: Microsoft Visual Studio C++ Build Tools

**编译步骤：**
```bash
# 克隆仓库
git clone https://github.com/laishouchao/keyheat-map.git
cd keyheat-map

# 安装前端依赖
npm install

# 开发模式
npm run tauri dev

# 编译发布版本
npm run tauri build
```

## 🖥️ 跨平台支持

| 平台 | 状态 |
|------|------|
| Windows (x64) | ✅ 支持 |
| macOS (Intel/Apple Silicon) | ✅ 支持 |
| Ubuntu/Debian | ✅ 支持 |
| Fedora | ✅ 支持 |
| Arch Linux | ✅ 支持 |

## 📸 截图

> 启动应用后，在后台静默记录键盘和鼠标数据，打开窗口即可查看精美的热力图和数据分析。

## 📄 许可证

MIT License

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [rdev](https://github.com/Narsil/rdev) - 全局输入事件监听
- [Recharts](https://recharts.org/) - React 图表库
