import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles, Minimize2, Github, Keyboard } from 'lucide-react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { keyLayouts } from '../utils/keyLayout';
import { getHeatColor, ColorScheme } from '../utils/colorUtils';
import { formatNumber, formatDate, formatDistance } from '../utils/formatters';

type PosterStyle = 'esport' | 'minimal' | 'github';

// 后端返回的类型
interface KeyCount {
  key_name: string;
  count: number;
}

interface OverallStats {
  total_keys: number;
  total_clicks: number;
  total_distance: number;
  active_minutes: number;
  total_sessions: number;
}

interface DailyStats {
  date: string;
  total_keys: number;
  total_clicks: number;
  total_distance: number;
}

interface ComboKeyCount {
  combo_name: string;
  count: number;
}

// 海报数据类型
interface PosterData {
  keyCounts: Record<string, number>;
  totalKeys: number;
  totalClicks: number;
  totalDistance: number;
  activeMinutes: number;
  topKey: [string, number] | null;
  topCombo: [string, number] | null;
  topCombos: [string, number][];
  activeDays: number;
  contributions: number[][];
}

const GITHUB_URL = 'https://github.com/laishouchao/keyheat-map';

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

// 生成二维码 DataURL
async function generateQRDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return '';
  }
}

// 迷你键盘热力图
function MiniKeyboard({ keyCounts, scheme }: { keyCounts: Record<string, number>; scheme: ColorScheme }) {
  const maxCount = Math.max(...Object.values(keyCounts), 1);
  const scale = 0.45;
  const layoutInfo = keyLayouts['60%'];
  const scaledWidth = layoutInfo.width * scale;
  const scaledHeight = layoutInfo.height * scale;

  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox={`0 0 ${layoutInfo.width} ${layoutInfo.height}`}
    >
      {layoutInfo.data.map((k) => {
        const count = keyCounts[k.key] || 0;
        const color = getHeatColor(count, maxCount, scheme);
        return (
          <rect
            key={k.key}
            x={k.x}
            y={k.y}
            width={k.width}
            height={46}
            rx={4}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

// 二维码组件
function QRCodeImage({ qrDataUrl, isDark }: { qrDataUrl: string; isDark: boolean }) {
  if (!qrDataUrl) return null;
  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      style={{
        width: 64,
        height: 64,
        borderRadius: 6,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #eee',
      }}
    />
  );
}

// 电竞炫酷风海报
function EsportPoster({ data, nickname, qrDataUrl }: { data: PosterData; nickname: string; qrDataUrl: string }) {
  return (
    <div
      style={{
        width: 600,
        height: 900,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
        borderRadius: 16,
        padding: 36,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      {/* 背景装饰 */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,212,0.15) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(247,37,133,0.1) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,247,0.08) 0%, transparent 70%)' }} />

      {/* 粒子装饰 */}
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', width: Math.random() * 4 + 1, height: Math.random() * 4 + 1, borderRadius: '50%', background: ['#00f5d4', '#f72585', '#7b2ff7', '#fee440'][i % 4], top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.6 + 0.2 }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg, #00f5d4, #7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>KeyHeat Map</h1>
          <div style={{ fontSize: 14, color: '#8888a0' }}>键盘 & 鼠标使用数据报告</div>
        </div>

        {/* 用户信息 */}
        <div style={{ textAlign: 'center', marginBottom: 24, padding: '14px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>{nickname}</div>
          <div style={{ fontSize: 13, color: '#8888a0' }}>{formatDate(new Date())} | 活跃 {data.activeDays} 天</div>
        </div>

        {/* 统计数据 - 2行3列 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: '总按键数', value: formatNumber(data.totalKeys), color: '#00f5d4' },
            { label: '鼠标点击', value: formatNumber(data.totalClicks), color: '#f72585' },
            { label: '鼠标移动', value: formatDistance(data.totalDistance), color: '#fee440' },
            { label: '最常用按键', value: data.topKey ? data.topKey[0].replace('Key', '') : '-', color: '#00f5d4' },
            { label: '最常用组合', value: data.topCombo ? data.topCombo[0] : '-', color: '#f72585' },
            { label: '活跃时长', value: data.activeMinutes >= 60 ? `${Math.floor(data.activeMinutes / 60)}h${data.activeMinutes % 60}m` : `${data.activeMinutes}m`, color: '#fee440' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '12px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#8888a0', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* TOP 3 快捷键 */}
        {data.topCombos.length > 0 && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#8888a0', marginBottom: 8 }}>🔥 常用快捷键 TOP 3</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {data.topCombos.slice(0, 3).map(([name, count], i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ['#00f5d4', '#f72585', '#fee440'][i], fontFamily: "'JetBrains Mono', monospace" }}>{name}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{formatNumber(count)} 次</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <MiniKeyboard keyCounts={data.keyCounts} scheme="neon" />
          </div>
        </div>

        {/* 底部：二维码 + 项目地址 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <QRCodeImage qrDataUrl={qrDataUrl} isDark={true} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ marginBottom: 2 }}>KeyHeat Map | Generated with ❤️</div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>github.com/laishouchao/keyheat-map</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 极简数据风海报
function MinimalPoster({ data, nickname, qrDataUrl }: { data: PosterData; nickname: string; qrDataUrl: string }) {
  return (
    <div
      style={{
        width: 600,
        height: 900,
        background: '#fafafa',
        borderRadius: 16,
        padding: 44,
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#999', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Keyboard & Mouse Report</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{nickname}</h1>
          <div style={{ fontSize: 14, color: '#999' }}>{formatDate(new Date())} | 活跃 {data.activeDays} 天</div>
        </div>

        {/* 大数字 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{formatNumber(data.totalKeys)}</div>
          <div style={{ fontSize: 16, color: '#999', marginTop: 6 }}>总按键次数</div>
        </div>

        {/* 统计卡片 - 2行3列 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: '鼠标点击', value: formatNumber(data.totalClicks), sub: '次' },
            { label: '鼠标移动', value: formatDistance(data.totalDistance), sub: '' },
            { label: '活跃时长', value: data.activeMinutes >= 60 ? `${Math.floor(data.activeMinutes / 60)}h${data.activeMinutes % 60}m` : `${data.activeMinutes}m`, sub: '' },
            { label: '最常用按键', value: data.topKey ? data.topKey[0].replace('Key', '') : '-', sub: `${formatNumber(data.topKey?.[1] || 0)} 次` },
            { label: '最常用组合', value: data.topCombo ? data.topCombo[0] : '-', sub: `${formatNumber(data.topCombo?.[1] || 0)} 次` },
            { label: '日均按键', value: formatNumber(Math.floor(data.totalKeys / Math.max(data.activeDays, 1))), sub: '次/天' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #eee' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{stat.value}</div>
              {stat.sub && <div style={{ fontSize: 11, color: '#ccc', marginTop: 2 }}>{stat.sub}</div>}
            </div>
          ))}
        </div>

        {/* TOP 3 快捷键 */}
        {data.topCombos.length > 0 && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>常用快捷键 TOP 3</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {data.topCombos.slice(0, 3).map(([name, count], i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ['#1a1a1a', '#666', '#999'][i], fontFamily: "'JetBrains Mono', monospace" }}>{name}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{formatNumber(count)} 次</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #eee' }}>
            <MiniKeyboard keyCounts={data.keyCounts} scheme="mono" />
          </div>
        </div>

        {/* 底部：二维码 + 项目地址 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <QRCodeImage qrDataUrl={qrDataUrl} isDark={false} />
          <div style={{ fontSize: 11, color: '#bbb', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ marginBottom: 2, color: '#999' }}>KeyHeat Map</div>
            <div>github.com/laishouchao/keyheat-map</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// GitHub 贡献风海报
function GithubPoster({ data, nickname, qrDataUrl }: { data: PosterData; nickname: string; qrDataUrl: string }) {
  const maxContrib = Math.max(...data.contributions.flat(), 1);

  return (
    <div
      style={{
        width: 600,
        height: 900,
        background: '#0d1117',
        borderRadius: 16,
        padding: 36,
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #00f5d4, #7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>{nickname}</div>
              <div style={{ fontSize: 13, color: '#7d8590' }}>键盘 & 鼠标活跃度 | {data.activeDays} 天活跃</div>
            </div>
          </div>
        </div>

        {/* 统计 */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: '总按键', value: formatNumber(data.totalKeys) },
            { label: '鼠标点击', value: formatNumber(data.totalClicks) },
            { label: '鼠标移动', value: formatDistance(data.totalDistance) },
            { label: '最常用', value: data.topKey ? data.topKey[0].replace('Key', '') : '-' },
            { label: '日均', value: formatNumber(Math.floor(data.totalKeys / Math.max(data.activeDays, 1))) },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 10, color: '#7d8590', marginBottom: 3 }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* TOP 3 快捷键 */}
        {data.topCombos.length > 0 && (
          <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#7d8590', marginBottom: 6 }}>常用快捷键 TOP 3</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {data.topCombos.slice(0, 3).map(([name, count], i) => (
                <div key={i}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace" }}>{name}</span>
                  <span style={{ fontSize: 10, color: '#7d8590', marginLeft: 4 }}>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 贡献图 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: '#7d8590', marginBottom: 10 }}>过去一年的键盘活跃度</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {data.contributions.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((val, di) => {
                  const intensity = val / maxContrib;
                  let bg = '#161b22';
                  if (intensity > 0) bg = `rgba(0, 245, 212, ${Math.max(0.15, intensity)})`;
                  return <div key={di} style={{ width: 9, height: 9, borderRadius: 2, background: bg }} />;
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 9, color: '#7d8590' }}>少</span>
            {['#161b22', 'rgba(0,245,212,0.15)', 'rgba(0,245,212,0.35)', 'rgba(0,245,212,0.6)', 'rgba(0,245,212,0.9)'].map((c) => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 9, color: '#7d8590' }}>多</span>
          </div>
        </div>

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <MiniKeyboard keyCounts={data.keyCounts} scheme="cool" />
        </div>

        {/* 底部：二维码 + 项目地址 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <QRCodeImage qrDataUrl={qrDataUrl} isDark={true} />
          <div style={{ fontSize: 11, color: '#484f58', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ marginBottom: 2, color: '#7d8590' }}>KeyHeat Map</div>
            <div>github.com/laishouchao/keyheat-map</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosterPage() {
  const [posterStyle, setPosterStyle] = useState<PosterStyle>('esport');
  const [nickname, setNickname] = useState('键盘侠');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterData, setPosterData] = useState<PosterData>({
    keyCounts: {},
    totalKeys: 0,
    totalClicks: 0,
    totalDistance: 0,
    activeMinutes: 0,
    topKey: null,
    topCombo: null,
    topCombos: [],
    activeDays: 0,
    contributions: Array.from({ length: 52 }, () =>
      Array.from({ length: 7 }, () => 0)
    ),
  });

  // 生成二维码
  useEffect(() => {
    generateQRDataUrl(GITHUB_URL).then(setQrDataUrl);
  }, []);

  const fetchPosterData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, topKeys, heatmapData, dailyStats, topCombos] = await Promise.all([
        invokeTauri<OverallStats>('get_stats'),
        invokeTauri<KeyCount[]>('get_top_keys', { limit: 1 }),
        invokeTauri<KeyCount[]>('get_heatmap_data', { period: 'all' }),
        invokeTauri<DailyStats[]>('get_daily_stats', { days: 365 }),
        invokeTauri<ComboKeyCount[]>('get_top_combos', { limit: 3 }),
      ]);

      // 转换按键热力图数据
      const keyCounts: Record<string, number> = {};
      if (heatmapData) {
        heatmapData.forEach(k => {
          keyCounts[k.key_name] = k.count;
        });
      }

      // 获取最常用按键
      let topKey: [string, number] | null = null;
      if (topKeys && topKeys.length > 0) {
        topKey = [topKeys[0].key_name, topKeys[0].count];
      }

      // 获取最常用组合键
      let topCombo: [string, number] | null = null;
      const comboList: [string, number][] = [];
      if (topCombos && topCombos.length > 0) {
        topCombo = [topCombos[0].combo_name, topCombos[0].count];
        topCombos.forEach(c => comboList.push([c.combo_name, c.count]));
      }

      // 计算活跃天数
      let activeDays = 0;
      if (dailyStats) {
        activeDays = dailyStats.filter(d => d.total_keys > 0 || d.total_clicks > 0).length;
      }

      // 生成贡献图数据
      const contributions = Array.from({ length: 52 }, () =>
        Array.from({ length: 7 }, () => 0)
      );
      if (dailyStats && dailyStats.length > 0) {
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        dailyStats.forEach(d => {
          const date = new Date(d.date);
          if (date >= oneYearAgo) {
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            const weekIndex = Math.min(51, Math.floor(diffDays / 7));
            const dayIndex = date.getDay();
            if (weekIndex >= 0 && weekIndex < 52) {
              contributions[weekIndex][dayIndex] = d.total_keys;
            }
          }
        });
      }

      setPosterData({
        keyCounts,
        totalKeys: stats?.total_keys || 0,
        totalClicks: stats?.total_clicks || 0,
        totalDistance: stats?.total_distance || 0,
        activeMinutes: stats?.active_minutes || 0,
        topKey,
        topCombo,
        topCombos: comboList,
        activeDays,
        contributions,
      });
    } catch (e) {
      console.error('获取海报数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosterData();
  }, [fetchPosterData]);

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `keyheat-${posterStyle}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('海报生成失败:', err);
    } finally {
      setDownloading(false);
    }
  }, [posterStyle]);

  const styleLabels: Record<PosterStyle, { label: string; icon: React.ElementType; desc: string }> = {
    esport: { label: '电竞炫酷', icon: Sparkles, desc: '深色背景 + 霓虹色彩' },
    minimal: { label: '极简数据', icon: Minimize2, desc: '白色背景 + 简洁设计' },
    github: { label: 'GitHub 风格', icon: Github, desc: '仿 GitHub 贡献图' },
  };

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">分享海报</h2>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>加载中...</div>
      </div>
    );
  }

  const hasData = posterData.totalKeys > 0;

  return (
    <div className="page-container">
      <h2 className="page-title">分享海报</h2>

      {/* 控制面板 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>用户昵称</label>
            <input className="input-field" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="输入你的昵称" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>海报风格</label>
            <div className="tab-group">
              {(Object.entries(styleLabels) as [PosterStyle, typeof styleLabels[PosterStyle]][]).map(([key, val]) => {
                const Icon = val.icon;
                return (
                  <button key={key} className={`tab-item ${posterStyle === key ? 'active' : ''}`} onClick={() => setPosterStyle(key)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={14} />
                    {val.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn-primary" onClick={handleDownload} disabled={downloading || !hasData} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: (downloading || !hasData) ? 0.7 : 1 }}>
            <Download size={16} />
            {downloading ? '生成中...' : '下载海报'}
          </button>
        </div>
      </div>

      {/* 海报预览 */}
      {hasData ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={posterRef}>
            {posterStyle === 'esport' && <EsportPoster data={posterData} nickname={nickname} qrDataUrl={qrDataUrl} />}
            {posterStyle === 'minimal' && <MinimalPoster data={posterData} nickname={nickname} qrDataUrl={qrDataUrl} />}
            {posterStyle === 'github' && <GithubPoster data={posterData} nickname={nickname} qrDataUrl={qrDataUrl} />}
          </div>
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}><Keyboard size={48} /></div>
          <div style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-secondary)' }}>暂无数据生成海报</div>
          <div style={{ fontSize: 13 }}>开始使用后这里将生成你的键盘使用海报</div>
        </div>
      )}
    </div>
  );
}
