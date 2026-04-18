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

// 模拟数据
function generateMockData() {
  const keyCounts: Record<string, number> = {};
  keyLayout60.forEach((k) => {
    if (k.key === 'Space') {
      keyCounts[k.key] = Math.floor(Math.random() * 3000) + 2000;
    } else if (['Backspace', 'Enter', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'AltLeft'].includes(k.key)) {
      keyCounts[k.key] = Math.floor(Math.random() * 800) + 200;
    } else if (['KeyE', 'KeyA', 'KeyI', 'KeyO', 'KeyN', 'KeyT', 'KeyR', 'KeyS', 'KeyL', 'KeyH'].includes(k.key)) {
      keyCounts[k.key] = Math.floor(Math.random() * 600) + 100;
    } else {
      keyCounts[k.key] = Math.floor(Math.random() * 300);
    }
  });

  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    按键数: i >= 8 && i <= 23
      ? Math.floor(Math.random() * 500) + (i >= 9 && i <= 11 ? 300 : i >= 14 && i <= 17 ? 400 : 100)
      : Math.floor(Math.random() * 50),
  }));

  const totalKeys = Object.values(keyCounts).reduce((a, b) => a + b, 0);
  const mouseClicks = Math.floor(Math.random() * 3000) + 1000;
  const mouseDistance = Math.floor(Math.random() * 50000) + 10000;
  const activeSeconds = Math.floor(Math.random() * 28800) + 3600;

  return { keyCounts, hourlyActivity, totalKeys, mouseClicks, mouseDistance, activeSeconds };
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

// 键盘热力图
function KeyboardHeatmap({ keyCounts }: { keyCounts: Record<string, number> }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const maxCount = useMemo(
    () => Math.max(...Object.values(keyCounts), 1),
    [keyCounts]
  );
  const totalKeys = useMemo(
    () => Object.values(keyCounts).reduce((a, b) => a + b, 0),
    [keyCounts]
  );

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

            return (
              <g key={k.key}>
                <rect
                  x={k.x}
                  y={k.y}
                  width={k.width}
                  height={46}
                  rx={6}
                  fill={color}
                  stroke={isHovered ? 'var(--neon-cyan)' : 'transparent'}
                  strokeWidth={isHovered ? 2 : 0}
                  style={{ cursor: 'pointer', transition: 'stroke 0.15s ease' }}
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
  const [data] = useState(generateMockData);

  return (
    <div className="page-container">
      {/* 统计卡片 */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          icon={Keyboard}
          label="今日按键总数"
          value={data.totalKeys}
          format={formatNumber}
          color="#00f5d4"
          delay={0}
        />
        <StatCard
          icon={MousePointer2}
          label="今日鼠标点击"
          value={data.mouseClicks}
          format={formatNumber}
          color="#f72585"
          delay={0.05}
        />
        <StatCard
          icon={Move}
          label="鼠标移动距离"
          value={data.mouseDistance}
          format={formatDistance}
          color="#7b2ff7"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="活跃时长"
          value={data.activeSeconds}
          format={formatDuration}
          color="#fee440"
          delay={0.15}
        />
      </div>

      {/* 键盘热力图 */}
      <KeyboardHeatmap keyCounts={data.keyCounts} />

      {/* 图表区域 */}
      <div className="grid-2" style={{ marginTop: 20 }}>
        <HourlyChart data={data.hourlyActivity} />
        <TopKeys keyCounts={data.keyCounts} />
      </div>
    </div>
  );
}
