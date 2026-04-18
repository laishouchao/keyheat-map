import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles, Minimize2, Github } from 'lucide-react';
import html2canvas from 'html2canvas';
import { keyLayout60, KEYBOARD_WIDTH, KEYBOARD_HEIGHT } from '../utils/keyLayout';
import { getHeatColor, ColorScheme } from '../utils/colorUtils';
import { formatNumber, formatDate } from '../utils/formatters';

type PosterStyle = 'esport' | 'minimal' | 'github';

// 模拟数据
function generatePosterData() {
  const keyCounts: Record<string, number> = {};
  keyLayout60.forEach((k) => {
    if (k.key === 'Space') keyCounts[k.key] = Math.floor(Math.random() * 5000) + 3000;
    else if (['Backspace', 'Enter'].includes(k.key)) keyCounts[k.key] = Math.floor(Math.random() * 1200) + 400;
    else if (['KeyE', 'KeyA', 'KeyI', 'KeyO', 'KeyN', 'KeyT', 'KeyR', 'KeyS', 'KeyL', 'KeyH'].includes(k.key))
      keyCounts[k.key] = Math.floor(Math.random() * 800) + 200;
    else keyCounts[k.key] = Math.floor(Math.random() * 400);
  });
  const totalKeys = Object.values(keyCounts).reduce((a, b) => a + b, 0);
  const topKey = Object.entries(keyCounts).sort(([, a], [, b]) => b - a)[0];
  const activeDays = Math.floor(Math.random() * 30) + 15;

  // GitHub 贡献图数据
  const contributions = Array.from({ length: 52 }, () =>
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 20))
  );

  return { keyCounts, totalKeys, topKey, activeDays, contributions };
}

// 迷你键盘热力图
function MiniKeyboard({ keyCounts, scheme }: { keyCounts: Record<string, number>; scheme: ColorScheme }) {
  const maxCount = Math.max(...Object.values(keyCounts), 1);
  const scale = 0.45;
  const scaledWidth = KEYBOARD_WIDTH * scale;
  const scaledHeight = KEYBOARD_HEIGHT * scale;

  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox={`0 0 ${KEYBOARD_WIDTH} ${KEYBOARD_HEIGHT}`}
    >
      {keyLayout60.map((k) => {
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

// 电竞炫酷风海报
function EsportPoster({ data, nickname }: { data: ReturnType<typeof generatePosterData>; nickname: string }) {
  return (
    <div
      style={{
        width: 600,
        height: 800,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
        borderRadius: 16,
        padding: 40,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,245,212,0.15) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -50, left: -50,
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(247,37,133,0.1) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,47,247,0.08) 0%, transparent 70%)',
      }} />

      {/* 粒子装饰 */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            borderRadius: '50%',
            background: ['#00f5d4', '#f72585', '#7b2ff7', '#fee440'][i % 4],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
          }}
        />
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800,
            background: 'linear-gradient(135deg, #00f5d4, #7b2ff7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            KeyHeat Map
          </h1>
          <div style={{ fontSize: 14, color: '#8888a0' }}>键盘使用数据报告</div>
        </div>

        {/* 用户信息 */}
        <div style={{
          textAlign: 'center', marginBottom: 32,
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>{nickname}</div>
          <div style={{ fontSize: 13, color: '#8888a0' }}>
            {formatDate(new Date())} | 活跃 {data.activeDays} 天
          </div>
        </div>

        {/* 统计数据 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: '总按键数', value: formatNumber(data.totalKeys), color: '#00f5d4' },
            { label: '最常用按键', value: (data.topKey?.[0]?.replace('Key', '') || '-'), color: '#f72585' },
            { label: '活跃天数', value: `${data.activeDays} 天`, color: '#fee440' },
          ].map((stat) => (
            <div key={stat.label} style={{
              textAlign: 'center',
              padding: '16px 8px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 11, color: '#8888a0', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <MiniKeyboard keyCounts={data.keyCounts} scheme="neon" />
          </div>
        </div>

        {/* 水印 */}
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.15)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          KeyHeat Map | Generated with love
        </div>
      </div>
    </div>
  );
}

// 极简数据风海报
function MinimalPoster({ data, nickname }: { data: ReturnType<typeof generatePosterData>; nickname: string }) {
  return (
    <div
      style={{
        width: 600,
        height: 800,
        background: '#fafafa',
        borderRadius: 16,
        padding: 48,
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#999', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
            Keyboard Usage Report
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{nickname}</h1>
          <div style={{ fontSize: 14, color: '#999' }}>{formatDate(new Date())}</div>
        </div>

        {/* 大数字 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {formatNumber(data.totalKeys)}
          </div>
          <div style={{ fontSize: 16, color: '#999', marginTop: 8 }}>总按键次数</div>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: '最常用按键', value: data.topKey?.[0]?.replace('Key', '') || '-', sub: `${formatNumber(data.topKey?.[1] || 0)} 次` },
            { label: '活跃天数', value: `${data.activeDays}`, sub: '天' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: 20,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #eee',
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: '#bbb', marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
          }}>
            <MiniKeyboard keyCounts={data.keyCounts} scheme="mono" />
          </div>
        </div>

        {/* 水印 */}
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#ddd',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          KeyHeat Map
        </div>
      </div>
    </div>
  );
}

// GitHub 贡献风海报
function GithubPoster({ data, nickname }: { data: ReturnType<typeof generatePosterData>; nickname: string }) {
  const maxContrib = Math.max(...data.contributions.flat(), 1);

  return (
    <div
      style={{
        width: 600,
        height: 800,
        background: '#0d1117',
        borderRadius: 16,
        padding: 40,
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f5d4, #7b2ff7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>
              {nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>{nickname}</div>
              <div style={{ fontSize: 13, color: '#7d8590' }}>键盘活跃度 | {data.activeDays} 天活跃</div>
            </div>
          </div>
        </div>

        {/* 统计 */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
          {[
            { label: '总按键', value: formatNumber(data.totalKeys) },
            { label: '最常用', value: data.topKey?.[0]?.replace('Key', '') || '-' },
            { label: '日均', value: formatNumber(Math.floor(data.totalKeys / Math.max(data.activeDays, 1))) },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 11, color: '#7d8590', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* 贡献图 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#7d8590', marginBottom: 12 }}>过去一年的键盘活跃度</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {data.contributions.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((val, di) => {
                  const intensity = val / maxContrib;
                  let bg = '#161b22';
                  if (intensity > 0) bg = `rgba(0, 245, 212, ${Math.max(0.15, intensity)})`;
                  return <div key={di} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />;
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: '#7d8590' }}>少</span>
            {['#161b22', 'rgba(0,245,212,0.15)', 'rgba(0,245,212,0.35)', 'rgba(0,245,212,0.6)', 'rgba(0,245,212,0.9)'].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: '#7d8590' }}>多</span>
          </div>
        </div>

        {/* 迷你键盘 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <MiniKeyboard keyCounts={data.keyCounts} scheme="cool" />
        </div>

        {/* 水印 */}
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#30363d',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          KeyHeat Map
        </div>
      </div>
    </div>
  );
}

export default function PosterPage() {
  const [posterStyle, setPosterStyle] = useState<PosterStyle>('esport');
  const [nickname, setNickname] = useState('键盘侠');
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const [data] = useState(generatePosterData);

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

  return (
    <div className="page-container">
      <h2 className="page-title">分享海报</h2>

      {/* 控制面板 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* 昵称输入 */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              用户昵称
            </label>
            <input
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称"
            />
          </div>

          {/* 风格选择 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              海报风格
            </label>
            <div className="tab-group">
              {(Object.entries(styleLabels) as [PosterStyle, typeof styleLabels[PosterStyle]][]).map(([key, val]) => {
                const Icon = val.icon;
                return (
                  <button
                    key={key}
                    className={`tab-item ${posterStyle === key ? 'active' : ''}`}
                    onClick={() => setPosterStyle(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon size={14} />
                    {val.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 下载按钮 */}
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: downloading ? 0.7 : 1 }}
          >
            <Download size={16} />
            {downloading ? '生成中...' : '下载海报'}
          </button>
        </div>
      </div>

      {/* 海报预览 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <div ref={posterRef}>
          {posterStyle === 'esport' && <EsportPoster data={data} nickname={nickname} />}
          {posterStyle === 'minimal' && <MinimalPoster data={data} nickname={nickname} />}
          {posterStyle === 'github' && <GithubPoster data={data} nickname={nickname} />}
        </div>
      </motion.div>
    </div>
  );
}
