import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { keyLayout60, keyRegions } from '../utils/keyLayout';
import { formatNumber, formatPercent, formatDate } from '../utils/formatters';

type TimeRange = 'today' | 'week' | 'month' | 'all';

// 模拟数据生成
function generateStatsData() {
  const keyCounts: Record<string, number> = {};
  keyLayout60.forEach((k) => {
    if (k.key === 'Space') keyCounts[k.key] = Math.floor(Math.random() * 5000) + 3000;
    else if (['Backspace', 'Enter'].includes(k.key)) keyCounts[k.key] = Math.floor(Math.random() * 1200) + 400;
    else if (['KeyE', 'KeyA', 'KeyI', 'KeyO', 'KeyN', 'KeyT', 'KeyR', 'KeyS', 'KeyL', 'KeyH'].includes(k.key))
      keyCounts[k.key] = Math.floor(Math.random() * 800) + 200;
    else keyCounts[k.key] = Math.floor(Math.random() * 400);
  });

  // 每日趋势
  const dailyTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: formatDate(d),
      按键数: Math.floor(Math.random() * 8000) + 2000,
      鼠标点击: Math.floor(Math.random() * 4000) + 500,
    };
  });

  // 24小时热力分布（7天 x 24小时）
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const hourlyHeatmap = weekDays.map((day, di) => ({
    day,
    hours: Array.from({ length: 24 }, (_, hi) => {
      const isWeekend = di >= 5;
      const isWorkHour = hi >= 9 && hi <= 18;
      const base = isWeekend ? 20 : isWorkHour ? 60 : 15;
      return Math.floor(Math.random() * base) + Math.floor(Math.random() * 30);
    }),
  }));

  // 鼠标移动热力图（10x10 网格）
  const mouseHeatmap = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
  );

  return { keyCounts, dailyTrend, hourlyHeatmap, mouseHeatmap };
}

const PIE_COLORS = ['#00f5d4', '#f72585', '#7b2ff7', '#fee440', '#4361ee', '#06d6a0'];

const tooltipStyle = {
  contentStyle: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 8,
    fontSize: 12,
    color: '#e8e8f0',
  },
  labelStyle: { color: '#8888a0' },
};

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [data] = useState(generateStatsData);

  const timeRangeLabels: Record<TimeRange, string> = {
    today: '今日',
    week: '本周',
    month: '本月',
    all: '全部',
  };

  // 按区域分类的饼图数据
  const regionData = useMemo(() => {
    const regions: Record<string, number> = {};
    for (const [region, keys] of Object.entries(keyRegions)) {
      regions[region] = keys.reduce((sum, k) => sum + (data.keyCounts[k] || 0), 0);
    }
    return Object.entries(regions)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [data.keyCounts]);

  // 按键详细表格数据
  const tableData = useMemo(() => {
    const total = Object.values(data.keyCounts).reduce((a, b) => a + b, 0);
    return Object.entries(data.keyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count], index) => ({
        key,
        displayKey: key.replace('Key', '').replace('Digit', '').replace('Left', ' L').replace('Right', ' R') || key,
        count,
        percent: formatPercent(count, total),
        rank: index + 1,
        change: Math.floor(Math.random() * 10) - 3,
      }));
  }, [data.keyCounts]);

  // 过滤趋势数据
  const filteredTrend = useMemo(() => {
    switch (timeRange) {
      case 'today':
        return data.dailyTrend.slice(-1);
      case 'week':
        return data.dailyTrend.slice(-7);
      case 'month':
        return data.dailyTrend.slice(-30);
      case 'all':
        return data.dailyTrend;
      default:
        return data.dailyTrend;
    }
  }, [data.dailyTrend, timeRange]);

  // 热力图最大值
  const maxHourly = useMemo(
    () => Math.max(...data.hourlyHeatmap.flatMap((d) => d.hours), 1),
    [data.hourlyHeatmap]
  );

  const maxMouse = useMemo(
    () => Math.max(...data.mouseHeatmap.flat(), 1),
    [data.mouseHeatmap]
  );

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>数据分析</h2>
        <div className="tab-group">
          {(['today', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              className={`tab-item ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* 按键趋势折线图 */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 20 }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>按键趋势</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={filteredTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#55556a' }}
              axisLine={{ stroke: '#1e1e2e' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#55556a' }}
              axisLine={{ stroke: '#1e1e2e' }}
              tickLine={false}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number, name: string) => [
                formatNumber(value),
                name,
              ]}
            />
            <Line
              type="monotone"
              dataKey="按键数"
              stroke="#00f5d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00f5d4' }}
            />
            <Line
              type="monotone"
              dataKey="鼠标点击"
              stroke="#f72585"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f72585' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* 按键分布饼图 */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>按键分布</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {regionData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number) => [formatNumber(value), '按键数']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
            {regionData.map((item, index) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 24小时热力分布 */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>24小时热力分布（本周）</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 2, minWidth: 500 }}>
              {/* 小时标签 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
                <div style={{ height: 16 }} />
                {data.hourlyHeatmap.map((d) => (
                  <div
                    key={d.day}
                    style={{
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    周{d.day}
                  </div>
                ))}
              </div>
              {/* 热力格子 */}
              {Array.from({ length: 24 }, (_, hi) => (
                <div key={hi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {hi}
                  </div>
                  {data.hourlyHeatmap.map((d, di) => {
                    const val = d.hours[hi];
                    const intensity = val / maxHourly;
                    const bg = val === 0
                      ? '#1a1a2e'
                      : `rgba(0, 245, 212, ${Math.max(0.1, intensity)})`;
                    return (
                      <div
                        key={`${di}-${hi}`}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          background: bg,
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        title={`周${d.day} ${hi}:00 - ${val} 次`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 鼠标移动热力图 */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{ marginBottom: 20 }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>鼠标移动热力图</h3>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: 3,
              width: 320,
              height: 320,
              background: 'var(--bg-primary)',
              borderRadius: 8,
              padding: 8,
            }}
          >
            {data.mouseHeatmap.flat().map((val, i) => {
              const intensity = val / maxMouse;
              const bg = val === 0
                ? '#1a1a2e'
                : `rgba(247, 37, 133, ${Math.max(0.1, intensity)})`;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 3,
                    background: bg,
                    transition: 'all 0.15s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 详细统计表格 */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>按键详细统计</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {['排名', '按键', '次数', '占比', '排名变化'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 20).map((row) => (
                <tr
                  key={row.key}
                  style={{
                    borderBottom: '1px solid var(--border-primary)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>
                    {row.rank}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 500 }}>
                    {row.displayKey}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(row.count)}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                    {row.percent}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        color: row.change > 0 ? '#06d6a0' : row.change < 0 ? '#f72585' : 'var(--text-muted)',
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {row.change > 0 ? `+${row.change}` : row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
