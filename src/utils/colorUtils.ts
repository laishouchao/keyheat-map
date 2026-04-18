export type ColorScheme = 'neon' | 'warm' | 'cool' | 'mono';

// 颜色方案定义
const colorSchemes: Record<ColorScheme, string[]> = {
  neon: [
    '#1a1a2e', // 0次 - 深灰
    '#0d3b66', // 低频 - 深蓝
    '#006d77', // 蓝绿
    '#00b4d8', // 亮蓝
    '#48cae4', // 浅蓝
    '#90e0ef', // 淡蓝
    '#fee440', // 黄色
    '#f4a261', // 橙色
    '#e76f51', // 红橙
    '#f72585', // 粉红
  ],
  warm: [
    '#1a1a2e',
    '#3d1c02',
    '#6b2d0f',
    '#9a3c1a',
    '#c4521e',
    '#e76f51',
    '#f4a261',
    '#fee440',
    '#ff9f1c',
    '#f72585',
  ],
  cool: [
    '#1a1a2e',
    '#0d1b2a',
    '#1b263b',
    '#274060',
    '#3a6ea5',
    '#00b4d8',
    '#48cae4',
    '#90e0ef',
    '#00f5d4',
    '#7b2ff7',
  ],
  mono: [
    '#1a1a2e',
    '#2a2a3e',
    '#3a3a52',
    '#4a4a66',
    '#5a5a7a',
    '#6a6a8e',
    '#7a7aa2',
    '#8a8ab6',
    '#9a9aca',
    '#00f5d4',
  ],
};

/**
 * 根据频率值获取对应颜色
 * @param count 按键次数
 * @param maxCount 最大按键次数
 * @param scheme 配色方案
 * @returns 颜色字符串
 */
export function getHeatColor(
  count: number,
  maxCount: number,
  scheme: ColorScheme = 'neon'
): string {
  if (count === 0) return colorSchemes[scheme][0];
  if (maxCount === 0) return colorSchemes[scheme][0];

  const ratio = Math.min(count / maxCount, 1);
  const colors = colorSchemes[scheme];
  const index = Math.floor(ratio * (colors.length - 1));
  const nextIndex = Math.min(index + 1, colors.length - 1);
  const localRatio = (ratio * (colors.length - 1)) - index;

  return interpolateColor(colors[index], colors[nextIndex], localRatio);
}

/**
 * HSL 颜色插值
 */
export function interpolateColor(color1: string, color2: string, ratio: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 获取颜色透明度版本
 */
export function getColorWithAlpha(hexColor: string, alpha: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 根据背景色判断文字颜色（黑/白）
 */
export function getContrastTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0a0a0f' : '#e8e8f0';
}

/**
 * 获取配色方案的所有颜色
 */
export function getSchemeColors(scheme: ColorScheme): string[] {
  return colorSchemes[scheme];
}
