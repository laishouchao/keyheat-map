import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Keyboard, MousePointer2, Move, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { keyLayouts } from '../utils/keyLayout';
import { getHeatColor, getContrastTextColor } from '../utils/colorUtils';
import { formatNumber, formatDistance, formatDuration, formatPercent } from '../utils/formatters';

// 后端返回的类型
interface OverallStats {
  total_keys: number;
  total_clicks: number;
  total_mouse_distance: number;
  active_seconds: number;
  total_sessions: number;
}

interface KeyCount {
  key_name: string;
  count: number;
}

interface HourlyDistribution {
  hour: number;
  count: number;
}

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

// 动画数字组件
function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  const [prevValue, setPrevValue] = useState(0);

  useEffect(() => {
    // 只有当 value 真正变化时才动画
    if (value === prevValue) return;

    const duration = 800;
    const startTime = Date.now();
    const startVal = prevValue; // 从上一次的值开始

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    tick();
    setPrevValue(value); // 更新上一次的值
  }, [value, prevValue]);

  return <span style={{ fontFamily: 'var(--font-mono)' }}>{format(display)}</span>;
}

// 统计卡片
function StatCard({
  icon: Icon,
  label,
  value,
  format,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  format: (n: number) => string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          <AnimatedNumber value={value} format={format} />
        </div>
      </div>
    </motion.div>
  );
}

// 高亮时稍微提亮颜色
function brightenColor(color: string): string {
  if (color === '#1a1a2e' || color === '#13131a') return '#2a3a4e';
  return color;
}

// 键盘热力图
function KeyboardHeatmap({ keyCounts, colorScheme = 'neon', layout = '60%' }: { keyCounts: Record<string, number>; colorScheme?: string; layout?: string }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set()); // 当前按下的键
  const maxCount = useMemo(
    () => Math.max(...Object.values(keyCounts), 1),
    [keyCounts]
  );
  const totalKeys = useMemo(
    () => Object.values(keyCounts).reduce((a, b) => a + b, 0),
    [keyCounts]
  );

  const layoutInfo = keyLayouts[layout] || keyLayouts['60%'];
  const keys = layoutInfo.data;
  const kbWidth = layoutInfo.width;
  const kbHeight = layoutInfo.height;

  // 监听后端 Tauri 事件实现实时高亮（不使用浏览器 keydown/keyup，避免事件冲突）
  useEffect(() => {
    let unlistenOn: (() => void) | null = null;
    let unlistenOff: (() => void) | null = null;

    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<string>('key-highlight-on', (event) => {
          const keyName = event.payload;
          if (keyName) {
            setActiveKeys(prev => new Set(prev).add(keyName));
          }
        }).then(fn => { unlistenOn = fn; }).catch(() => {});

        listen<string>('key-highlight-off', (event) => {
          const keyName = event.payload;
          if (keyName) {
            setActiveKeys(prev => {
              const next = new Set(prev);
              next.delete(keyName);
              return next;
            });
          }
        }).then(fn => { unlistenOff = fn; }).catch(() => {});
      });
    }

    return () => {
      if (unlistenOn) unlistenOn();
      if (unlistenOff) unlistenOff();
    };
  }, []);

  const hoveredData = hoveredKey
    ? { count: keyCounts[hoveredKey] || 0, percent: formatPercent(keyCounts[hoveredKey] || 0, totalKeys) }
    : null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>键盘热力图</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {layoutInfo.name} 布局
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
        <svg
          width={kbWidth + 20}
          height={kbHeight + 20}
          viewBox={`-10 -10 ${kbWidth + 20} ${kbHeight + 20}`}
          style={{ maxWidth: '100%' }}
        >
          {keys.map((k) => {
            const count = keyCounts[k.key] || 0;
            const color = getHeatColor(count, maxCount, colorScheme as any);
            const textColor = getContrastTextColor(color);
            const isHovered = hoveredKey === k.key;
            const isActive = activeKeys.has(k.key);

            return (
              <g key={k.key} style={{ transition: 'all 0.1s ease' }}>
                <rect
                  x={k.x}
                  y={k.y}
                  width={k.width}
                  height={46}
                  rx={6}
                  fill={isActive ? brightenColor(color) : color}
                  stroke={isActive ? '#00f5d4' : (isHovered ? 'var(--neon-cyan)' : 'transparent')}
                  strokeWidth={isActive ? 2.5 : (isHovered ? 2 : 0)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 245, 212, 0.6))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredKey(k.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
                <text
                  x={k.x + k.width / 2}
                  y={k.y + (k.label ? 20 : 23)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  fontSize={k.width > 80 ? 11 : 12}
                  fontFamily="var(--font-mono)"
                  fontWeight={500}
                  style={{ pointerEvents: 'none' }}
                >
                  {k.label}
                </text>
                {count > 0 && k.width >= 46 && (
                  <text
                    x={k.x + k.width / 2}
                    y={k.y + 35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor}
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    opacity={0.8}
                    style={{ pointerEvents: 'none' }}
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 悬停提示 */}
      {hoveredKey && hoveredData && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            zIndex: 10,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 4, color: 'var(--neon-cyan)' }}>
            {hoveredKey}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            次数: <span style={{ color: 'var(--text-primary)' }}>{formatNumber(hoveredData.count)}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            占比: <span style={{ color: 'var(--text-primary)' }}>{hoveredData.percent}</span>
          </div>
        </div>
      )}

      {/* 颜色图例 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>低频</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['#1a1a2e', '#0d3b66', '#006d77', '#00b4d8', '#48cae4', '#90e0ef', '#fee440', '#f4a261', '#e76f51', '#f72585'].map((c) => (
            <div
              key={c}
              style={{
                width: 16,
                height: 8,
                borderRadius: 2,
                background: c,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>高频</span>
      </div>
    </motion.div>
  );
}

// 今日活跃度迷你图表
function HourlyChart({ data }: { data: { hour: string; 操作数: number }[] }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>今日活跃度</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00f5d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#55556a' }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
            interval={3}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: 8,
              fontSize: 12,
              color: '#e8e8f0',
            }}
            labelStyle={{ color: '#8888a0' }}
            formatter={(value: number) => [formatNumber(value), '操作数']}
          />
          <Area
            type="monotone"
            dataKey="操作数"
            stroke="#00f5d4"
            strokeWidth={2}
            fill="url(#colorKeys)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// TOP 5 按键
function TopKeys({ keyCounts }: { keyCounts: Record<string, number> }) {
  const topKeys = useMemo(() => {
    return Object.entries(keyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [keyCounts]);

  const maxCount = topKeys[0]?.[1] || 1;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>最常用按键 TOP 5</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topKeys.map(([key, count], index) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 20,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: index === 0 ? '#fee440' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)',
              }}
            >
              #{index + 1}
            </span>
            <span
              style={{
                width: 60,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--neon-cyan)',
                fontWeight: 500,
              }}
            >
              {key.replace('Key', '').replace('Digit', '').replace('Left', 'L').replace('Right', 'R') || key}
            </span>
            <div style={{ flex: 1, height: 20, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))`,
                  borderRadius: 4,
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: 50, textAlign: 'right' }}>
              {formatNumber(count)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<KeyCount[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState('neon');
  const [layout, setLayout] = useState('60%');

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await invokeTauri<AppSettings>('get_app_settings');
      if (settings) {
        setColorScheme(settings.color_scheme || 'neon');
        if (settings.keyboard_layout && keyLayouts[settings.keyboard_layout]) {
          setLayout(settings.keyboard_layout);
        }
      }
    };
    loadSettings();
  }, []);

  const fetchData = async () => {
    try {
      const [s, h, hr, settings] = await Promise.all([
        invokeTauri<OverallStats>('get_stats'),
        invokeTauri<KeyCount[]>('get_heatmap_data', { period: 'today' }),
        invokeTauri<HourlyDistribution[]>('get_hourly_distribution'),
        invokeTauri<AppSettings>('get_app_settings'),
      ]);
      if (s) setStats(s);
      if (h) setHeatmapData(h);
      if (hr) setHourlyData(hr);
      if (settings) {
        setColorScheme(settings.color_scheme || 'neon');
        if (settings.keyboard_layout && keyLayouts[settings.keyboard_layout]) {
          setLayout(settings.keyboard_layout);
        }
      }
    } catch (e) {
      console.error('获取数据失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let unlisten: (() => void) | null = null;
    let unlistenSettings: (() => void) | null = null;
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<string>('input-event', () => {
          fetchData();
        }).then(fn => { unlisten = fn; }).catch(() => {});
      }).catch(() => {});
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('settings-changed', () => {
          fetchData();
        }).then(fn => { unlistenSettings = fn; }).catch(() => {});
      }).catch(() => {});
    }

    const timer = setInterval(fetchData, 5000);
    return () => {
      clearInterval(timer);
      if (unlisten) unlisten();
      if (unlistenSettings) unlistenSettings();
    };
  }, []);

  // 将后端 KeyCount[] 转换为 keyCounts Record（key_name -> count）
  const keyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    heatmapData.forEach(k => {
      map[k.key_name] = k.count;
    });
    return map;
  }, [heatmapData]);

  // 将 HourlyDistribution 转换为图表数据
  const hourlyChartData = useMemo(() => {
    // 确保有完整的24小时数据
    const fullData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      操作数: 0,
    }));
    hourlyData.forEach(h => {
      if (h.hour >= 0 && h.hour < 24) {
        fullData[h.hour] = {
          hour: `${String(h.hour).padStart(2, '0')}:00`,
          操作数: h.count,
        };
      }
    });
    return fullData;
  }, [hourlyData]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          加载中...
        </div>
      </div>
    );
  }

  const totalKeys = stats?.total_keys || 0;
  const mouseClicks = stats?.total_clicks || 0;
  const mouseDistance = stats?.total_mouse_distance || 0;
  const activeSeconds = stats?.active_seconds || 0;
  const hasData = totalKeys > 0 || mouseClicks > 0;

  if (!hasData) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>
            <Keyboard size={48} />
          </div>
          <div style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-secondary)' }}>
            开始使用后这里将显示你的键盘热力数据
          </div>
          <div style={{ fontSize: 13 }}>
            打开键盘记录功能，开始追踪你的按键习惯
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 统计卡片 */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          icon={Keyboard}
          label="今日按键总数"
          value={totalKeys}
          format={formatNumber}
          color="#00f5d4"
          delay={0}
        />
        <StatCard
          icon={MousePointer2}
          label="今日鼠标点击"
          value={mouseClicks}
          format={formatNumber}
          color="#f72585"
          delay={0.05}
        />
        <StatCard
          icon={Move}
          label="鼠标移动距离"
          value={mouseDistance}
          format={formatDistance}
          color="#7b2ff7"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="活跃时长"
          value={activeSeconds}
          format={formatDuration}
          color="#fee440"
          delay={0.15}
        />
      </div>

      {/* 键盘热力图 */}
      <KeyboardHeatmap keyCounts={keyCounts} colorScheme={colorScheme} layout={layout} />

      {/* 图表区域 */}
      <div className="grid-2" style={{ marginTop: 20 }}>
        <HourlyChart data={hourlyChartData} />
        <TopKeys keyCounts={keyCounts} />
      </div>
    </div>
  );
}
