/**
 * 版本号同步脚本
 * 唯一版本来源：src/config/version.ts 中的 APP_VERSION
 * 构建时自动同步到：package.json, tauri.conf.json, Cargo.toml, public/version.json
 *
 * 用法：node scripts/sync-version.cjs
 */
const fs = require('fs');
const path = require('path');

// 1. 从 src/config/version.ts 读取版本号
const versionFile = path.join(__dirname, '..', 'src', 'config', 'version.ts');
const content = fs.readFileSync(versionFile, 'utf-8');
const match = content.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!match) {
  console.error('❌ 无法从 src/config/version.ts 中读取 APP_VERSION');
  process.exit(1);
}
const version = match[1];
console.log(`📦 检测到版本号: v${version}`);

// 2. 同步到 package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
if (pkg.version !== version) {
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  ✅ package.json');
} else {
  console.log('  ⏭️  package.json (已是最新)');
}

// 3. 同步到 tauri.conf.json
const tauriPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));
if (tauri.package.version !== version) {
  tauri.package.version = version;
  fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
  console.log('  ✅ src-tauri/tauri.conf.json');
} else {
  console.log('  ⏭️  src-tauri/tauri.conf.json (已是最新)');
}

// 4. 同步到 Cargo.toml
const cargoPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
const cargo = fs.readFileSync(cargoPath, 'utf-8');
const updatedCargo = cargo.replace(
  /^version\s*=\s*"[^"]+"/m,
  `version = "${version}"`
);
if (updatedCargo !== cargo) {
  fs.writeFileSync(cargoPath, updatedCargo);
  console.log('  ✅ src-tauri/Cargo.toml');
} else {
  console.log('  ⏭️  src-tauri/Cargo.toml (已是最新)');
}

// 5. 生成 public/version.json（供运行时读取）
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify({ version }, null, 2)
);
console.log('  ✅ public/version.json');

console.log(`\n🎉 版本号同步完成: v${version}`);
