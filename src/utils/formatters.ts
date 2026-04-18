/**
 * 数字格式化 - 千分位分隔
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString('zh-CN');
}

/**
 * 距离格式化（像素 -> 米 -> 公里）
 * 假设 96 DPI，1 英寸 = 2.54cm
 */
export function formatDistance(pixels: number): string {
  const meters = pixels * 0.026458333; // 1px ≈ 0.026458333m (96 DPI)
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km';
  }
  if (meters >= 1) {
    return meters.toFixed(1) + ' m';
  }
  return Math.round(meters * 100) + ' cm';
}

/**
 * 时间格式化（秒 -> 分 -> 小时）
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
  }
  return `${Math.round(seconds)}秒`;
}

/**
 * 日期格式化
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 时间格式化 HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * 日期时间格式化
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 百分比格式化
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

/**
 * 相对时间格式化
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 生成今日日期范围字符串
 */
export function getTodayRange(): string {
  return formatDate(new Date());
}

/**
 * 生成本周日期范围字符串
 */
export function getWeekRange(): string {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  return `${formatDate(monday)} ~ ${formatDate(now)}`;
}

/**
 * 生成本月日期范围字符串
 */
export function getMonthRange(): string {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return `${formatDate(firstDay)} ~ ${formatDate(now)}`;
}
