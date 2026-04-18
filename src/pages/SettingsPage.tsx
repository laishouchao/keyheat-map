import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Power, Minimize2, Globe, HardDrive, Trash2, Download,
  Palette, Keyboard, ExternalLink, Copy,
} from 'lucide-react';
import { ColorScheme } from '../utils/colorUtils';

type KeyboardLayout = '60%' | '75%' | 'full';

// 设置项组件
function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color="var(--text-secondary)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
          {description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// 开关组件
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`toggle-switch ${value ? 'active' : ''}`}
      onClick={() => onChange(!value)}
    />
  );
}

// 设置区块
function SettingSection({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ marginBottom: 20 }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const [autoStart, setAutoStart] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [language, setLanguage] = useState('zh');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('neon');
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>('60%');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const colorSchemes: { value: ColorScheme; label: string; colors: string[] }[] = [
    { value: 'neon', label: '霓虹', colors: ['#00f5d4', '#f72585', '#7b2ff7', '#fee440'] },
    { value: 'warm', label: '暖色', colors: ['#e76f51', '#f4a261', '#fee440', '#ff9f1c'] },
    { value: 'cool', label: '冷色', colors: ['#00b4d8', '#48cae4', '#90e0ef', '#00f5d4'] },
    { value: 'mono', label: '单色', colors: ['#4a4a66', '#6a6a8e', '#8a8ab6', '#00f5d4'] },
  ];

  const handleExport = (format: 'json' | 'csv') => {
    const mockData = { exported: true, format, timestamp: new Date().toISOString() };
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(mockData, null, 2) : 'timestamp,action\n' + mockData.timestamp + ',export'],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `keyheat-data.${format}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setShowClearConfirm(false);
    // 实际项目中调用 Tauri 命令清除数据
  };

  return (
    <div className="page-container">
      <h2 className="page-title">设置</h2>

      {/* 基本设置 */}
      <SettingSection title="基本设置" delay={0}>
        <SettingRow
          icon={Power}
          label="开机自启动"
          description="系统启动时自动运行 KeyHeat Map"
        >
          <Toggle value={autoStart} onChange={setAutoStart} />
        </SettingRow>

        <SettingRow
          icon={Minimize2}
          label="最小化到托盘"
          description="关闭窗口时最小化到系统托盘"
        >
          <Toggle value={minimizeToTray} onChange={setMinimizeToTray} />
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="语言"
          description="选择界面显示语言"
        >
          <select
            className="select-field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* 数据管理 */}
      <SettingSection title="数据管理" delay={0.1}>
        <SettingRow
          icon={HardDrive}
          label="数据存储位置"
          description="应用数据保存在本地"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ~/.keyheat-map/
            </span>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
              title="复制路径"
              onClick={() => {
                navigator.clipboard?.writeText('~/.keyheat-map/');
              }}
            >
              <Copy size={14} />
            </button>
          </div>
        </SettingRow>

        <SettingRow
          icon={Download}
          label="导出数据"
          description="将使用数据导出为文件"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => handleExport('json')} style={{ padding: '6px 14px', fontSize: 12 }}>
              JSON
            </button>
            <button className="btn-secondary" onClick={() => handleExport('csv')} style={{ padding: '6px 14px', fontSize: 12 }}>
              CSV
            </button>
          </div>
        </SettingRow>

        <SettingRow
          icon={Trash2}
          label="清除所有数据"
          description="删除所有按键记录和使用数据"
        >
          {!showClearConfirm ? (
            <button
              onClick={handleClearData}
              style={{
                background: 'rgba(247, 37, 133, 0.1)',
                border: '1px solid rgba(247, 37, 133, 0.3)',
                color: '#f72585',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
              }}
            >
              清除数据
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={confirmClear}
                style={{
                  background: '#f72585',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                确认清除
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                取消
              </button>
            </div>
          )}
        </SettingRow>
      </SettingSection>

      {/* 热力图设置 */}
      <SettingSection title="热力图设置" delay={0.2}>
        <SettingRow
          icon={Palette}
          label="颜色主题"
          description="选择热力图的配色方案"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: colorScheme === scheme.value
                    ? '2px solid var(--neon-cyan)'
                    : '1px solid var(--border-primary)',
                  background: colorScheme === scheme.value ? 'var(--bg-active)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {scheme.colors.map((c) => (
                    <div key={c} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{scheme.label}</span>
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          icon={Keyboard}
          label="键盘布局"
          description="选择键盘布局类型"
        >
          <select
            className="select-field"
            value={keyboardLayout}
            onChange={(e) => setKeyboardLayout(e.target.value as KeyboardLayout)}
            style={{ width: 120 }}
          >
            <option value="60%">60%</option>
            <option value="75%">75%</option>
            <option value="full">全尺寸</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* 关于 */}
      <SettingSection title="关于" delay={0.3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>版本</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>v0.1.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>构建</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>2024.12.01</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>GitHub</span>
            <a
              href="https://github.com/keyheat-map"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                color: 'var(--neon-cyan)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              keyheat-map <ExternalLink size={12} />
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>许可证</span>
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>MIT License</span>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
