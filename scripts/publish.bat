@echo off
REM KeyHeat Map - GitHub 发布脚本 (Windows)
REM 使用前请确保已安装 gh CLI 并登录: gh auth login

set REPO_OWNER=laishouchao
set REPO_NAME=keyheat-map
set VERSION=v0.1.0

echo 🔥 KeyHeat Map - GitHub 发布脚本
echo ================================

REM 1. 初始化 Git 仓库
if not exist ".git" (
    echo 📦 初始化 Git 仓库...
    git init
    git checkout -b main
)

REM 2. 添加远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 添加远程仓库...
    git remote add origin https://github.com/%REPO_OWNER%/%REPO_NAME%.git
)

REM 3. 提交代码
echo 📝 提交代码...
git add .
git commit -m "feat: KeyHeat Map v0.1.0"

REM 4. 推送
echo 🚀 推送代码...
git push -u origin main --force

REM 5. 创建 Release
echo 📦 创建 GitHub Release %VERSION%...
gh release create %VERSION% ^
    ./release/keyheat-map_0.1.0_amd64.deb ^
    ./release/keyheat-map-0.1.0-1.x86_64.rpm ^
    ./release/keyheat-map-linux-amd64 ^
    --title "KeyHeat Map %VERSION%" ^
    --repo %REPO_OWNER%/%REPO_NAME%

echo ✅ 发布完成！
echo 🔗 https://github.com/%REPO_OWNER%/%REPO_NAME%/releases/tag/%VERSION%
pause
