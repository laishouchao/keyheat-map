import { useState, useCallback } from 'react';

const styles = {
  titlebar: {
    height: 36,
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    flexShrink: 0,
    paddingLeft: 60, // sidebar width
  },
  trafficLights: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 10, // 确保在 drag region 之上
  },
  dot: (color: string) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
    cursor: 'pointer' as const,
    transition: 'opacity 0.15s ease',
    border: 'none',
    padding: 0,
    outline: 'none',
  }),
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 0.5,
  },
};

export default function TitleBar() {
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);

  const handleClose = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { getCurrent } = await import('@tauri-apps/api/window');
        await getCurrent().close(); // 后端会拦截为隐藏到托盘
      }
    } catch (e) {
      console.error('关闭窗口失败:', e);
    }
  }, []);

  const handleMinimize = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { getCurrent } = await import('@tauri-apps/api/window');
        await getCurrent().minimize();
      }
    } catch (e) {
      console.error('最小化窗口失败:', e);
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { getCurrent } = await import('@tauri-apps/api/window');
        await getCurrent().toggleMaximize();
      }
    } catch (e) {
      console.error('最大化窗口失败:', e);
    }
  }, []);

  return (
    <div
      style={styles.titlebar}
      data-tauri-drag-region
    >
      {/* traffic lights 区域在 drag region 外部，确保点击不被吞掉 */}
      <div style={styles.trafficLights}>
        <button
          style={{
            ...styles.dot('#ff5f57'),
            opacity: hoveredDot === 'close' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('close')}
          onMouseLeave={() => setHoveredDot(null)}
          onClick={handleClose}
          title="关闭"
          aria-label="关闭窗口"
        />
        <button
          style={{
            ...styles.dot('#febc2e'),
            opacity: hoveredDot === 'minimize' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('minimize')}
          onMouseLeave={() => setHoveredDot(null)}
          onClick={handleMinimize}
          title="最小化"
          aria-label="最小化窗口"
        />
        <button
          style={{
            ...styles.dot('#28c840'),
            opacity: hoveredDot === 'maximize' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('maximize')}
          onMouseLeave={() => setHoveredDot(null)}
          onClick={handleMaximize}
          title="最大化"
          aria-label="最大化/还原窗口"
        />
      </div>
      <span style={styles.title} data-tauri-drag-region>KeyHeat Map</span>
    </div>
  );
}
