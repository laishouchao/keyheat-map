#!/bin/bash
# KeyHeat Map - GitHub 上传与发布脚本
# 使用前请确保已安装 gh CLI 并登录: gh auth login

set -e

REPO_OWNER="laishouchao"
REPO_NAME="keyheat-map"
VERSION="v0.1.0"

echo "🔥 KeyHeat Map - GitHub 发布脚本"
echo "================================"

# 1. 初始化 Git 仓库（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git checkout -b main
fi

# 2. 添加远程仓库（如果尚未添加）
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 添加远程仓库..."
    git remote add origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

# 3. 提交所有代码
echo "📝 提交代码..."
git add .
git commit -m "feat: 🎉 KeyHeat Map v0.1.0 - 跨平台键盘鼠标热力图应用

功能特性:
- 键盘热力图可视化（SVG 矢量键盘布局）
- 鼠标移动/点击热力图
- 数据分析仪表盘（趋势图、饼图、24h分布）
- 3种分享海报模板（电竞风/极简风/GitHub风）
- 系统托盘常驻 + 开机自启
- 数据导出（JSON/CSV）
- 多配色方案 + 多键盘布局

技术栈: Tauri v1 + React 18 + TypeScript + Rust + SQLite"

# 4. 推送到 GitHub
echo "🚀 推送代码到 GitHub..."
git push -u origin main --force

# 5. 创建 GitHub Release
echo "📦 创建 GitHub Release ${VERSION}..."
gh release create "${VERSION}" \
    ./release/keyheat-map_0.1.0_amd64.deb \
    ./release/keyheat-map-0.1.0-1.x86_64.rpm \
    ./release/keyheat-map-linux-amd64 \
    --title "KeyHeat Map ${VERSION}" \
    --notes "## 🔥 KeyHeat Map ${VERSION}

### 下载
- **Ubuntu/Debian**: \`keyheat-map_0.1.0_amd64.deb\`
- **Fedora/RHEL**: \`keyheat-map-0.1.0-1.x86_64.rpm\`
- **Linux 通用**: \`keyheat-map-linux-amd64\` (直接运行)

### 安装方式
\`\`\`bash
# Ubuntu/Debian
sudo dpkg -i keyheat-map_0.1.0_amd64.deb

# Fedora/RHEL
sudo rpm -i keyheat-map-0.1.0-1.x86_64.rpm

# 通用 Linux
chmod +x keyheat-map-linux-amd64
./keyheat-map-linux-amd64
\`\`\`

### 功能特性
- 🎹 实时键盘热力图
- 🖱️ 鼠标移动/点击追踪
- 📊 数据分析仪表盘
- 🖼️ 分享海报生成
- ⚙️ 系统托盘 + 开机自启

> ⚠️ Windows 和 macOS 版本需要在对应平台上编译。" \
    --repo "${REPO_OWNER}/${REPO_NAME}"

echo "✅ 发布完成！"
echo "🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${VERSION}"
