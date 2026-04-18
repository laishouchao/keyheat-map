# KeyHeat Map - 跨平台编译指南

## 当前环境已编译
✅ Linux (amd64) - DEB / RPM / 二进制

## Windows 编译

### 前置要求
1. 安装 [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 安装 [Node.js](https://nodejs.org/) >= 18
3. 安装 [Rust](https://rustup.rs/)

### 编译步骤
```powershell
# 克隆仓库
git clone https://github.com/laishouchao/keyheat-map.git
cd keyheat-map

# 安装前端依赖
npm install

# 编译（自动生成 .msi 安装包）
npm run tauri build
```

编译产物位于：`src-tauri/target/release/bundle/msi/`

## macOS 编译

### 前置要求
```bash
# 安装 Xcode 命令行工具
xcode-select --install

# 安装 Node.js (推荐使用 nvm)
brew install nvm
nvm install 18

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 编译步骤
```bash
git clone https://github.com/laishouchao/keyheat-map.git
cd keyheat-map
npm install
npm run tauri build
```

编译产物位于：`src-tauri/target/release/bundle/dmg/` 和 `macos/`

## GitHub Actions 自动编译（推荐）

在仓库中创建 `.github/workflows/release.yml`：

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
      - name: Install frontend dependencies
        run: npm install
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "KeyHeat Map ${{ github.ref_name }}"
          releaseBody: "See the assets to download this version."
          releaseDraft: true
          prerelease: false
```

推送 tag 即可自动编译所有平台：
```bash
git tag v0.1.0
git push origin v0.1.0
```
