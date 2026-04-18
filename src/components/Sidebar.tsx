import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Image, Settings, Flame } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/stats', icon: BarChart3, label: '数据分析' },
  { path: '/poster', icon: Image, label: '分享海报' },
  { path: '/settings', icon: Settings, label: '设置' },
];

const styles = {
  sidebar: {
    width: 60,
    height: '100%',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative' as const,
    flexShrink: 0,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  navButton: (isActive: boolean) => ({
    width: 40,
    height: 40,
    borderRadius: 8,
    border: 'none',
    background: isActive ? 'var(--neon-cyan)' : 'transparent',
    color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  }),
  logoSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  tooltip: {
    position: 'absolute' as const,
    left: 52,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
    zIndex: 100,
    border: '1px solid var(--border-secondary)',
    boxShadow: 'var(--shadow-md)',
  },
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={styles.sidebar}>
      <div style={styles.navSection}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              style={styles.navButton(isActive)}
              onClick={() => navigate(item.path)}
              title={item.label}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                const tip = document.createElement('div');
                tip.className = 'sidebar-tooltip';
                tip.textContent = item.label;
                tip.style.cssText = `
                  position: absolute; left: 52px; top: 50%; transform: translateY(-50%);
                  background: var(--bg-tertiary); color: var(--text-primary);
                  padding: 4px 10px; border-radius: 6px; font-size: 12px;
                  white-space: nowrap; pointer-events: none; z-index: 100;
                  border: 1px solid var(--border-secondary); box-shadow: var(--shadow-md);
                  font-family: var(--font-ui);
                `;
                el.appendChild(tip);
              }}
              onMouseLeave={(e) => {
                const tip = e.currentTarget.querySelector('.sidebar-tooltip');
                if (tip) tip.remove();
              }}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div style={styles.logoSection}>
        <Flame size={20} color="var(--neon-cyan)" />
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          v0.1.0
        </span>
      </div>
    </div>
  );
}
