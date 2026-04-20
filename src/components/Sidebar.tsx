import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Image, Settings, Flame } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/stats', icon: BarChart3, label: '数据分析' },
  { path: '/poster', icon: Image, label: '分享海报' },
  { path: '/settings', icon: Settings, label: '设置' },
];

const GITHUB_REPO = 'laishouchao/keyheat-map';

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
  updateBadge: {
    fontSize: 7,
    color: '#00f5d4',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    animation: 'pulse 2s ease-in-out infinite',
  },
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState('0.0.0');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  // 从 package.json 读取当前版本号
  useEffect(() => {
    fetch('/version.json')
      .then(r => r.json())
      .then(data => setAppVersion(data.version || '0.0.0'))
      .catch(() => setAppVersion('0.5.2'));
  }, []);

  // 检查 GitHub 是否有新版本
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const release = await res.json();
        const latest = release.tag_name.replace(/^v/, '');
        setLatestVersion(latest);

        // 比较版本号
        const currentParts = appVersion.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        const isNewer = latestParts.some((v: number, i: number) => v > (currentParts[i] || 0));
        setHasUpdate(isNewer);
      } catch {
        // 静默失败
      }
    };

    // 启动时检查一次，之后每30分钟检查一次
    checkUpdate();
    const interval = setInterval(checkUpdate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [appVersion]);

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
          v{appVersion}
        </span>
        {hasUpdate && (
          <span
            style={styles.updateBadge}
            title={`新版本 v${latestVersion} 可用，点击查看`}
            onClick={() => window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank')}
          >
            🔄 v{latestVersion}
          </span>
        )}
      </div>
    </div>
  );
}
