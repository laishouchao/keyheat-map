import { useState } from 'react';

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
  },
  dot: (color: string) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
    cursor: 'default',
    transition: 'opacity 0.15s ease',
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

  return (
    <div
      style={styles.titlebar}
      data-tauri-drag-region
    >
      <div style={styles.trafficLights}>
        <div
          style={{
            ...styles.dot('#ff5f57'),
            opacity: hoveredDot === 'close' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('close')}
          onMouseLeave={() => setHoveredDot(null)}
        />
        <div
          style={{
            ...styles.dot('#febc2e'),
            opacity: hoveredDot === 'minimize' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('minimize')}
          onMouseLeave={() => setHoveredDot(null)}
        />
        <div
          style={{
            ...styles.dot('#28c840'),
            opacity: hoveredDot === 'maximize' ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredDot('maximize')}
          onMouseLeave={() => setHoveredDot(null)}
        />
      </div>
      <span style={styles.title}>KeyHeat Map</span>
    </div>
  );
}
