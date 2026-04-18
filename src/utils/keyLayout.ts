export interface KeyData {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height?: number;
}

// 标准 60% 键盘布局 (单位: 1U = 46px, 间距 4px)
const U = 46;
const GAP = 4;
const STEP = U + GAP;

export const KEYBOARD_WIDTH = 15 * STEP - GAP; // 15U 宽度
export const KEYBOARD_HEIGHT = 5 * STEP - GAP; // 5 行

export const keyLayout60: KeyData[] = [
  // 第一行：数字行
  { key: 'Backquote', label: '`', x: 0, y: 0, width: U },
  { key: 'Digit1', label: '1', x: 1 * STEP, y: 0, width: U },
  { key: 'Digit2', label: '2', x: 2 * STEP, y: 0, width: U },
  { key: 'Digit3', label: '3', x: 3 * STEP, y: 0, width: U },
  { key: 'Digit4', label: '4', x: 4 * STEP, y: 0, width: U },
  { key: 'Digit5', label: '5', x: 5 * STEP, y: 0, width: U },
  { key: 'Digit6', label: '6', x: 6 * STEP, y: 0, width: U },
  { key: 'Digit7', label: '7', x: 7 * STEP, y: 0, width: U },
  { key: 'Digit8', label: '8', x: 8 * STEP, y: 0, width: U },
  { key: 'Digit9', label: '9', x: 9 * STEP, y: 0, width: U },
  { key: 'Digit0', label: '0', x: 10 * STEP, y: 0, width: U },
  { key: 'Minus', label: '-', x: 11 * STEP, y: 0, width: U },
  { key: 'Equal', label: '=', x: 12 * STEP, y: 0, width: U },
  { key: 'Backspace', label: 'Back', x: 13 * STEP, y: 0, width: 2 * U + GAP },

  // 第二行：QWERTY
  { key: 'Tab', label: 'Tab', x: 0, y: 1 * STEP, width: 1.5 * U + GAP * 0.5 },
  { key: 'KeyQ', label: 'Q', x: 1.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyW', label: 'W', x: 2.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyE', label: 'E', x: 3.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyR', label: 'R', x: 4.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyT', label: 'T', x: 5.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyY', label: 'Y', x: 6.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyU', label: 'U', x: 7.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyI', label: 'I', x: 8.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyO', label: 'O', x: 9.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'KeyP', label: 'P', x: 10.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'BracketLeft', label: '[', x: 11.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'BracketRight', label: ']', x: 12.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },
  { key: 'Backslash', label: '\\', x: 13.5 * STEP + GAP * 0.5, y: 1 * STEP, width: 1.5 * U + GAP * 0.5 },

  // 第三行：ASDF
  { key: 'CapsLock', label: 'Caps', x: 0, y: 2 * STEP, width: 1.75 * U + GAP * 0.75 },
  { key: 'KeyA', label: 'A', x: 1.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyS', label: 'S', x: 2.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyD', label: 'D', x: 3.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyF', label: 'F', x: 4.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyG', label: 'G', x: 5.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyH', label: 'H', x: 6.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyJ', label: 'J', x: 7.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyK', label: 'K', x: 8.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'KeyL', label: 'L', x: 9.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'Semicolon', label: ';', x: 10.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'Quote', label: "'", x: 11.75 * STEP + GAP * 0.75, y: 2 * STEP, width: U },
  { key: 'Enter', label: 'Enter', x: 12.75 * STEP + GAP * 0.75, y: 2 * STEP, width: 2.25 * U + GAP * 0.25 },

  // 第四行：ZXCV
  { key: 'ShiftLeft', label: 'Shift', x: 0, y: 3 * STEP, width: 2.25 * U + GAP * 0.25 },
  { key: 'KeyZ', label: 'Z', x: 2.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyX', label: 'X', x: 3.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyC', label: 'C', x: 4.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyV', label: 'V', x: 5.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyB', label: 'B', x: 6.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyN', label: 'N', x: 7.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'KeyM', label: 'M', x: 8.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'Comma', label: ',', x: 9.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'Period', label: '.', x: 10.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'Slash', label: '/', x: 11.25 * STEP + GAP * 0.25, y: 3 * STEP, width: U },
  { key: 'ShiftRight', label: 'Shift', x: 12.25 * STEP + GAP * 0.25, y: 3 * STEP, width: 2.75 * U + GAP * 0.75 },

  // 第五行：空格行
  { key: 'ControlLeft', label: 'Ctrl', x: 0, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaLeft', label: 'Win', x: 1.25 * STEP + GAP * 0.25, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'AltLeft', label: 'Alt', x: 2.5 * STEP + GAP * 0.5, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'Space', label: '', x: 3.75 * STEP + GAP * 0.75, y: 4 * STEP, width: 6.25 * U + GAP * 1.25 },
  { key: 'AltRight', label: 'Alt', x: 10 * STEP + GAP * 2, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaRight', label: 'Win', x: 11.25 * STEP + GAP * 2.25, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ContextMenu', label: 'Fn', x: 12.5 * STEP + GAP * 2.5, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ControlRight', label: 'Ctrl', x: 13.75 * STEP + GAP * 2.75, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
];

// 按键区域分类
export const keyRegions: Record<string, string[]> = {
  '字母区': ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
    'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'],
  '数字区': ['Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'],
  '符号区': ['Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash',
    'Semicolon', 'Quote', 'Comma', 'Period', 'Slash'],
  '修饰键': ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
    'MetaLeft', 'MetaRight', 'CapsLock'],
  '功能键': ['Backspace', 'Tab', 'Enter', 'Space', 'ContextMenu'],
};

// 获取按键所属区域
export function getKeyRegion(key: string): string {
  for (const [region, keys] of Object.entries(keyRegions)) {
    if (keys.includes(key)) return region;
  }
  return '其他';
}
