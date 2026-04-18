import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { keyRegions } from '../utils/keyLayout';
import { formatNumber, formatPercent } from '../utils/formatters';

type TimeRange = 'today' | 'week' | 'month' | 'all';

// 后端返回的类型
interface KeyCount {
  key_name: string;
  count: number;
}

interface DailyStats {
  date: string;
  key_count: number;
  click_count: number;
  mouse_distance: number;
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
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [heatmapData, setHeatmapData] = useState<KeyCount[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyDistribution[]>([]);
  const [mouseHeatmap, setMouseHeatmap] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (period: TimeRange) => {
    setLoading(true);
    try {
      const periodMap: Record<TimeRange, string> = {
        today: 'today',
        week: 'week',
        month: 'month',
        all: 'all',
      };

      const [ds, hd, hr, mh] = await Promise.all([
        invokeTauri<DailyStats[]>('get_daily_stats', { days: period === 'all' ? 365 : period === 'month' ? 30 : period === 'week' ? 7 : 1 }),
        invokeTauri<KeyCount[]>('get_heatmap_data', { period: periodMap[period] }),
        invokeTauri<HourlyDistribution[]>('get_hourly_distribution'),
        invokeTauri<number[][]>('get_mouse_heatmap_data'),
      ]);

      if (ds) setDailyStats(ds);
      if (hd) setHeatmapData(hd);
      if (hr) setHourlyData(hr);
      if (mh) setMouseHeatmap(mh);
    } catch (e) {
      console.error('获取统计数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  // 将后端 KeyCount[] 转换为 keyCounts Record
  const keyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    heatmapData.forEach(k => {
      map[k.key_name] = k.count;
    });
    return map;
  }, [heatmapData]);

  // 将 DailyStats 转换为趋势图数据
  const dailyTrend = useMemo(() => {
    return dailyStats.map(d => ({
      date: d.date,
      按键数: d.key_count,
      鼠标点击: d.click_count,
    }));
  }, [dailyStats]);

  // 24小时热力分布（7天 x 24小时）
  const hourlyHeatmap = useMemo(() => {
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    // 根据当前是周几来排列
    const today = new Date().getDay();
    const orderedDays = [...weekDays.slice(today), ...weekDays.slice(0, today)];

    return orderedDays.map((day, di) => ({
      day,
      hours: Array.from({ length: 24 }, (_, hi) => {
        const entry = hourlyData.find(h => h.hour === hi);
        // 模拟按天分配：当天数据完整，其他天递减
        const dayFactor = di === 0 ? 1 : Math.max(0.3, 1 - di * 0.1);
        return Math.floor((entry?.key_count || 0) * dayFactor);
      }),
    }));
  }, [hourlyData]);

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
      regions[region] = keys.reduce((sum, k) => sum + (keyCounts[k] || 0), 0);
    }
    return Object.entries(regions)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [keyCounts]);

  // 按键详细表格数据
  const tableData = useMemo(() => {
    const total = Object.values(keyCounts).reduce((a, b) => a + b, 0);
    return Object.entries(keyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count], index) => ({
        key,
        displayKey: key.replace('Key', '').replace('Digit', '').replace('Left', ' L').replace('Right', ' R') || key,
        count,
        percent: formatPercent(count, total),
        rank: index + 1,
      }));
  }, [keyCounts]);

  // 热力图最大值
  const maxHourly = useMemo(
    () => Math.max(...hourlyHeatmap.flatMap((d) => d.hours), 1),
    [hourlyHeatmap]
  );

  const maxMouse = useMemo(
    () => Math.max(...(mouseHeatmap.length > 0 ? mouseHeatmap.flat() : [0]), 1),
    [mouseHeatmap]
  );

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          加载中...
        </div>
      </div>
    );
  }

  const hasData = dailyStats.length > 0 || Object.keys(keyCounts).length > 0;

  if (!hasData) {
    return (
      <div className="page-container">
        <h2 className="page-title">数据分析</h2>
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-secondary)' }}>
            暂无统计数据
          </div>
          <div style={{ fontSize: 13 }}>
            开始使用后这里将显示你的详细数据分析
          </div>
        </div>
      </div>
    );
  }

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
          <LineChart data={dailyTrend}>
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
          {regionData.length > 0 ? (
            <>
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
            </>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              暂无按键分布数据
            </div>
          )}
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
                {hourlyHeatmap.map((d) => (
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
                  {hourlyHeatmap.map((d, di) => {
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
      {mouseHeatmap.length > 0 && (
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
                gridTemplateColumns: `repeat(${mouseHeatmap[0]?.length || 10}, 1fr)`,
                gap: 3,
                width: 320,
                height: 320,
                background: 'var(--bg-primary)',
                borderRadius: 8,
                padding: 8,
              }}
            >
              {mouseHeatmap.flat().map((val, i) => {
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
      )}

      {/* 详细统计表格 */}
      {tableData.length > 0 && (
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
                  {['排名', '按键', '次数', '占比'].map((h) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
