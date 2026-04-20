import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Power, Minimize2, Globe, HardDrive, Trash2, Download,
  Palette, Keyboard, ExternalLink, Copy,
} from 'lucide-react';
import { ColorScheme } from '../utils/colorUtils';
import { keyLayouts } from '../utils/keyLayout';

// 后端返回的类型
interface AppSettings {
  is_recording: boolean;
  auto_start: boolean;
  minimize_to_tray: boolean;
  language: string;
  color_scheme: string;
  keyboard_layout: string;
}

// 安全调用 Tauri invoke
async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<T>(command, args || {});
    } catch (e) {
      console.error(`调用 ${command} 失败:`, e);
      return null;
    }
  }
  return null;
}

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

// Toast 提示组件
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font-ui)',
        color: '#fff',
        background: type === 'success' ? 'rgba(0, 200, 150, 0.9)' : 'rgba(247, 37, 133, 0.9)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <span>{type === 'success' ? '✓' : '✗'}</span>
      <span>{message}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    is_recording: true,
    auto_start: false,
    minimize_to_tray: true,
    language: 'zh',
    color_scheme: 'neon',
    keyboard_layout: '60%',
  });
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 页面加载时获取设置
  useEffect(() => {
    invokeTauri<AppSettings>('get_app_settings').then(s => {
      if (s) setSettings(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // 更新单个设置项并保存到后端
  const updateSetting = useCallback(async (key: keyof AppSettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await invokeTauri('save_app_settings', { settings: newSettings });
      // 通知其他页面设置已变更
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        import('@tauri-apps/api/event').then(({ emit }) => {
          emit('settings-changed', {});
        }).catch(() => {});
      }
      setToast({ message: '设置已保存', type: 'success' });
    } catch (e) {
      console.error('保存设置失败:', e);
      setToast({ message: `保存失败: ${e}`, type: 'error' });
      // 回滚到旧设置
      setSettings(settings);
    }
  }, [settings]);

  // 切换录制状态
  const toggleRecording = useCallback(async () => {
    try {
      const result = await invokeTauri<boolean>('toggle_recording');
      if (result !== null) {
        setSettings(prev => ({ ...prev, is_recording: result }));
      }
    } catch (e) {
      console.error('切换录制状态失败:', e);
    }
  }, []);

  // 导出数据
  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const data = await invokeTauri<string>('export_data', { format });
      if (data) {
        const blob = new Blob([data], {
          type: format === 'json' ? 'application/json' : 'text/csv',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `keyheat-data.${format}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('导出数据失败:', e);
    } finally {
      setExporting(false);
    }
  }, []);

  // 清除数据
  const confirmClear = useCallback(async () => {
    setClearing(true);
    try {
      await invokeTauri('clear_all_data');
      setShowClearConfirm(false);
    } catch (e) {
      console.error('清除数据失败:', e);
    } finally {
      setClearing(false);
    }
  }, []);

  const colorSchemes: { value: ColorScheme; label: string; colors: string[] }[] = [
    { value: 'neon', label: '霓虹', colors: ['#00f5d4', '#f72585', '#7b2ff7', '#fee440'] },
    { value: 'warm', label: '暖色', colors: ['#e76f51', '#f4a261', '#fee440', '#ff9f1c'] },
    { value: 'cool', label: '冷色', colors: ['#00b4d8', '#48cae4', '#90e0ef', '#00f5d4'] },
    { value: 'mono', label: '单色', colors: ['#4a4a66', '#6a6a8e', '#8a8ab6', '#00f5d4'] },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">设置</h2>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 className="page-title">设置</h2>

      {/* 基本设置 */}
      <SettingSection title="基本设置" delay={0}>
        <SettingRow
          icon={Power}
          label="录制状态"
          description={settings.is_recording ? '正在记录按键和鼠标数据' : '已暂停记录'}
        >
          <Toggle value={settings.is_recording} onChange={toggleRecording} />
        </SettingRow>

        <SettingRow
          icon={Power}
          label="开机自启动"
          description="系统启动时自动运行 KeyHeat Map"
        >
          <Toggle
            value={settings.auto_start}
            onChange={(v) => updateSetting('auto_start', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Minimize2}
          label="最小化到托盘"
          description="关闭窗口时最小化到系统托盘"
        >
          <Toggle
            value={settings.minimize_to_tray}
            onChange={(v) => updateSetting('minimize_to_tray', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="语言"
          description="选择界面显示语言"
        >
          <select
            className="select-field"
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
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
            <button
              className="btn-secondary"
              onClick={() => handleExport('json')}
              disabled={exporting}
              style={{ padding: '6px 14px', fontSize: 12, opacity: exporting ? 0.7 : 1 }}
            >
              JSON
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              style={{ padding: '6px 14px', fontSize: 12, opacity: exporting ? 0.7 : 1 }}
            >
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
              onClick={() => setShowClearConfirm(true)}
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
                disabled={clearing}
                style={{
                  background: '#f72585',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  opacity: clearing ? 0.7 : 1,
                }}
              >
                {clearing ? '清除中...' : '确认清除'}
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
                onClick={() => updateSetting('color_scheme', scheme.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: settings.color_scheme === scheme.value
                    ? '2px solid var(--neon-cyan)'
                    : '1px solid var(--border-primary)',
                  background: settings.color_scheme === scheme.value ? 'var(--bg-active)' : 'var(--bg-primary)',
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
            value={settings.keyboard_layout}
            onChange={(e) => updateSetting('keyboard_layout', e.target.value)}
            style={{ width: 120 }}
          >
            {Object.entries(keyLayouts).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </SettingRow>
      </SettingSection>

      {/* 关于 */}
      <SettingSection title="关于" delay={0.3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>版本</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>v0.4.1</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>构建</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>2026.04.20</span>
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
