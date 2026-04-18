import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Keyboard, MousePointer2, Move, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { keyLayout60, KEYBOARD_WIDTH, KEYBOARD_HEIGHT } from '../utils/keyLayout';
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
  key_count: number;
  click_count: number;
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

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startVal = 0;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    tick();
  }, [value]);

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

// 将浏览器 KeyboardEvent 映射到 keyLayout 中的 key 标识
function mapEventToKey(e: KeyboardEvent): string | null {
  const code = e.code;

  // 直接匹配（大部分按键 code 和 rdev 格式一致）
  if (code.startsWith('Key')) return code; // "KeyA" -> "KeyA"
  if (code.startsWith('Digit')) return code.replace('Digit', 'Num'); // "Digit1" -> "Num1"
  if (code === 'Space') return 'Space';
  if (code === 'ShiftLeft') return 'ShiftLeft';
  if (code === 'ShiftRight') return 'ShiftRight';
  if (code === 'ControlLeft') return 'ControlLeft';
  if (code === 'ControlRight') return 'ControlRight';
  if (code === 'AltLeft') return 'Alt';
  if (code === 'AltRight') return 'AltGr';
  if (code === 'MetaLeft') return 'MetaLeft';
  if (code === 'MetaRight') return 'MetaRight';
  if (code === 'CapsLock') return 'CapsLock';
  if (code === 'Tab') return 'Tab';
  if (code === 'Enter') return 'Return';
  if (code === 'Backspace') return 'Backspace';
  if (code === 'Delete') return 'Delete';
  if (code === 'Insert') return 'Insert';
  if (code === 'Home') return 'Home';
  if (code === 'End') return 'End';
  if (code === 'PageUp') return 'PageUp';
  if (code === 'PageDown') return 'PageDown';
  if (code === 'ArrowUp') return 'UpArrow';
  if (code === 'ArrowDown') return 'DownArrow';
  if (code === 'ArrowLeft') return 'LeftArrow';
  if (code === 'ArrowRight') return 'RightArrow';
  if (code.startsWith('F') && code.length <= 3) {
    const num = parseInt(code.slice(1));
    if (num >= 1 && num <= 12) return `F${num}`;
  }
  if (code === 'Escape') return 'Escape';
  if (code === 'BracketLeft') return 'BracketLeft';
  if (code === 'BracketRight') return 'BracketRight';
  if (code === 'Semicolon') return 'Semicolon';
  if (code === 'Quote') return 'Quote';
  if (code === 'Backquote') return 'BackQuote';
  if (code === 'Backslash') return 'BackSlash';
  if (code === 'Slash') return 'Slash';
  if (code === 'Period') return 'Period';
  if (code === 'Comma') return 'Comma';
  if (code === 'Minus') return 'Minus';
  if (code === 'Equal') return 'Equal';

  return null;
}

// 高亮时稍微提亮颜色
function brightenColor(color: string): string {
  if (color === '#1a1a2e' || color === '#13131a') return '#2a3a4e';
  return color;
}

// 键盘热力图
function KeyboardHeatmap({ keyCounts }: { keyCounts: Record<string, number> }) {
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

  // 监听键盘事件实现实时高亮
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mappedKey = mapEventToKey(e);
      if (mappedKey) {
        setActiveKeys(prev => new Set(prev).add(mappedKey));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mappedKey = mapEventToKey(e);
      if (mappedKey) {
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(mappedKey);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
          60% 布局
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
        <svg
          width={KEYBOARD_WIDTH + 20}
          height={KEYBOARD_HEIGHT + 20}
          viewBox={`-10 -10 ${KEYBOARD_WIDTH + 20} ${KEYBOARD_HEIGHT + 20}`}
          style={{ maxWidth: '100%' }}
        >
          {keyLayout60.map((k) => {
            const count = keyCounts[k.key] || 0;
            const color = getHeatColor(count, maxCount);
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

// 24小时活跃度迷你图表
function HourlyChart({ data }: { data: { hour: string; 按键数: number }[] }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>24小时活跃度</h3>
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
            formatter={(value: number) => [formatNumber(value), '按键数']}
          />
          <Area
            type="monotone"
            dataKey="按键数"
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

  const fetchData = async () => {
    try {
      const [s, h, hr] = await Promise.all([
        invokeTauri<OverallStats>('get_stats'),
        invokeTauri<KeyCount[]>('get_heatmap_data', { period: 'today' }),
        invokeTauri<HourlyDistribution[]>('get_hourly_distribution'),
      ]);
      if (s) setStats(s);
      if (h) setHeatmapData(h);
      if (hr) setHourlyData(hr);
    } catch (e) {
      console.error('获取数据失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
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
      按键数: 0,
    }));
    hourlyData.forEach(h => {
      if (h.hour >= 0 && h.hour < 24) {
        fullData[h.hour] = {
          hour: `${String(h.hour).padStart(2, '0')}:00`,
          按键数: h.key_count,
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
      <KeyboardHeatmap keyCounts={keyCounts} />

      {/* 图表区域 */}
      <div className="grid-2" style={{ marginTop: 20 }}>
        <HourlyChart data={hourlyChartData} />
        <TopKeys keyCounts={keyCounts} />
      </div>
    </div>
  );
}
