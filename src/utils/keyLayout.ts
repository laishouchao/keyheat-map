export interface KeyData {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height?: number;
}

// 单位常量
const U = 46;
const GAP = 4;
const STEP = U + GAP; // 50

// ===== 60% 键盘布局 (15U 宽 x 5行) =====
const layout60: KeyData[] = [
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

// ===== 75% 键盘布局 (15U 宽 x 6行: 60% + F键行 + 方向键) =====
const layout75: KeyData[] = [
  // 第0行：F键行 + 功能键
  { key: 'Escape', label: 'Esc', x: 0, y: 0, width: U },
  { key: 'F1', label: 'F1', x: 1.5 * STEP, y: 0, width: U },
  { key: 'F2', label: 'F2', x: 2.5 * STEP, y: 0, width: U },
  { key: 'F3', label: 'F3', x: 3.5 * STEP, y: 0, width: U },
  { key: 'F4', label: 'F4', x: 4.5 * STEP, y: 0, width: U },
  { key: 'F5', label: 'F5', x: 6 * STEP, y: 0, width: U },
  { key: 'F6', label: 'F6', x: 7 * STEP, y: 0, width: U },
  { key: 'F7', label: 'F7', x: 8 * STEP, y: 0, width: U },
  { key: 'F8', label: 'F8', x: 9 * STEP, y: 0, width: U },
  { key: 'F9', label: 'F9', x: 10.5 * STEP, y: 0, width: U },
  { key: 'F10', label: 'F10', x: 11.5 * STEP, y: 0, width: U },
  { key: 'F11', label: 'F11', x: 12.5 * STEP, y: 0, width: U },
  { key: 'F12', label: 'F12', x: 13.5 * STEP, y: 0, width: U },
  // PrintScreen / ScrollLock / Pause
  { key: 'PrintScreen', label: 'PrtSc', x: 14.5 * STEP, y: 0, width: U },
  { key: 'ScrollLock', label: 'ScrLk', x: 15.5 * STEP, y: 0, width: U },
  { key: 'Pause', label: 'Pause', x: 16.5 * STEP, y: 0, width: U },

  // 第1行：数字行
  { key: 'Backquote', label: '`', x: 0, y: 1 * STEP, width: U },
  { key: 'Digit1', label: '1', x: 1 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit2', label: '2', x: 2 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit3', label: '3', x: 3 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit4', label: '4', x: 4 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit5', label: '5', x: 5 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit6', label: '6', x: 6 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit7', label: '7', x: 7 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit8', label: '8', x: 8 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit9', label: '9', x: 9 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit0', label: '0', x: 10 * STEP, y: 1 * STEP, width: U },
  { key: 'Minus', label: '-', x: 11 * STEP, y: 1 * STEP, width: U },
  { key: 'Equal', label: '=', x: 12 * STEP, y: 1 * STEP, width: U },
  { key: 'Backspace', label: 'Back', x: 13 * STEP, y: 1 * STEP, width: 2 * U + GAP },
  // Insert / Home / PgUp
  { key: 'Insert', label: 'Ins', x: 15 * STEP, y: 1 * STEP, width: U },
  { key: 'Home', label: 'Home', x: 16 * STEP, y: 1 * STEP, width: U },
  { key: 'PageUp', label: 'PgUp', x: 17 * STEP, y: 1 * STEP, width: U },

  // 第2行：QWERTY
  { key: 'Tab', label: 'Tab', x: 0, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  { key: 'KeyQ', label: 'Q', x: 1.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyW', label: 'W', x: 2.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyE', label: 'E', x: 3.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyR', label: 'R', x: 4.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyT', label: 'T', x: 5.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyY', label: 'Y', x: 6.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyU', label: 'U', x: 7.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyI', label: 'I', x: 8.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyO', label: 'O', x: 9.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyP', label: 'P', x: 10.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketLeft', label: '[', x: 11.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketRight', label: ']', x: 12.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'Backslash', label: '\\', x: 13.5 * STEP + GAP * 0.5, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  // Delete / End / PgDn
  { key: 'Delete', label: 'Del', x: 15 * STEP, y: 2 * STEP, width: U },
  { key: 'End', label: 'End', x: 16 * STEP, y: 2 * STEP, width: U },
  { key: 'PageDown', label: 'PgDn', x: 17 * STEP, y: 2 * STEP, width: U },

  // 第3行：ASDF
  { key: 'CapsLock', label: 'Caps', x: 0, y: 3 * STEP, width: 1.75 * U + GAP * 0.75 },
  { key: 'KeyA', label: 'A', x: 1.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyS', label: 'S', x: 2.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyD', label: 'D', x: 3.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyF', label: 'F', x: 4.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyG', label: 'G', x: 5.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyH', label: 'H', x: 6.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyJ', label: 'J', x: 7.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyK', label: 'K', x: 8.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyL', label: 'L', x: 9.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Semicolon', label: ';', x: 10.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Quote', label: "'", x: 11.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Enter', label: 'Enter', x: 12.75 * STEP + GAP * 0.75, y: 3 * STEP, width: 2.25 * U + GAP * 0.25 },

  // 第4行：ZXCV
  { key: 'ShiftLeft', label: 'Shift', x: 0, y: 4 * STEP, width: 2.25 * U + GAP * 0.25 },
  { key: 'KeyZ', label: 'Z', x: 2.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyX', label: 'X', x: 3.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyC', label: 'C', x: 4.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyV', label: 'V', x: 5.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyB', label: 'B', x: 6.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyN', label: 'N', x: 7.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyM', label: 'M', x: 8.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Comma', label: ',', x: 9.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Period', label: '.', x: 10.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Slash', label: '/', x: 11.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'ShiftRight', label: 'Shift', x: 12.25 * STEP + GAP * 0.25, y: 4 * STEP, width: 1.75 * U + GAP * 0.75 },
  // 方向键上
  { key: 'ArrowUp', label: '\u2191', x: 16 * STEP, y: 4 * STEP, width: U },

  // 第5行：空格行
  { key: 'ControlLeft', label: 'Ctrl', x: 0, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaLeft', label: 'Win', x: 1.25 * STEP + GAP * 0.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'AltLeft', label: 'Alt', x: 2.5 * STEP + GAP * 0.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'Space', label: '', x: 3.75 * STEP + GAP * 0.75, y: 5 * STEP, width: 6.25 * U + GAP * 1.25 },
  { key: 'AltRight', label: 'Alt', x: 10 * STEP + GAP * 2, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaRight', label: 'Win', x: 11.25 * STEP + GAP * 2.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ContextMenu', label: 'Fn', x: 12.5 * STEP + GAP * 2.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ControlRight', label: 'Ctrl', x: 13.75 * STEP + GAP * 2.75, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  // 方向键左/下/右
  { key: 'ArrowLeft', label: '\u2190', x: 15 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowDown', label: '\u2193', x: 16 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowRight', label: '\u2192', x: 17 * STEP, y: 5 * STEP, width: U },
];

// ===== TKL 键盘布局 (15U 主区 x 6行 + 右侧编辑键和方向键) =====
const layoutTKL: KeyData[] = [
  // 第0行：F键行
  { key: 'Escape', label: 'Esc', x: 0, y: 0, width: U },
  { key: 'F1', label: 'F1', x: 1.5 * STEP, y: 0, width: U },
  { key: 'F2', label: 'F2', x: 2.5 * STEP, y: 0, width: U },
  { key: 'F3', label: 'F3', x: 3.5 * STEP, y: 0, width: U },
  { key: 'F4', label: 'F4', x: 4.5 * STEP, y: 0, width: U },
  { key: 'F5', label: 'F5', x: 6 * STEP, y: 0, width: U },
  { key: 'F6', label: 'F6', x: 7 * STEP, y: 0, width: U },
  { key: 'F7', label: 'F7', x: 8 * STEP, y: 0, width: U },
  { key: 'F8', label: 'F8', x: 9 * STEP, y: 0, width: U },
  { key: 'F9', label: 'F9', x: 10.5 * STEP, y: 0, width: U },
  { key: 'F10', label: 'F10', x: 11.5 * STEP, y: 0, width: U },
  { key: 'F11', label: 'F11', x: 12.5 * STEP, y: 0, width: U },
  { key: 'F12', label: 'F12', x: 13.5 * STEP, y: 0, width: U },
  // PrtSc / ScrLk / Pause
  { key: 'PrintScreen', label: 'PrtSc', x: 15 * STEP, y: 0, width: U },
  { key: 'ScrollLock', label: 'ScrLk', x: 16 * STEP, y: 0, width: U },
  { key: 'Pause', label: 'Pause', x: 17 * STEP, y: 0, width: U },

  // 第1行：数字行
  { key: 'Backquote', label: '`', x: 0, y: 1 * STEP, width: U },
  { key: 'Digit1', label: '1', x: 1 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit2', label: '2', x: 2 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit3', label: '3', x: 3 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit4', label: '4', x: 4 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit5', label: '5', x: 5 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit6', label: '6', x: 6 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit7', label: '7', x: 7 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit8', label: '8', x: 8 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit9', label: '9', x: 9 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit0', label: '0', x: 10 * STEP, y: 1 * STEP, width: U },
  { key: 'Minus', label: '-', x: 11 * STEP, y: 1 * STEP, width: U },
  { key: 'Equal', label: '=', x: 12 * STEP, y: 1 * STEP, width: U },
  { key: 'Backspace', label: 'Back', x: 13 * STEP, y: 1 * STEP, width: 2 * U + GAP },
  // Ins / Home / PgUp
  { key: 'Insert', label: 'Ins', x: 15 * STEP, y: 1 * STEP, width: U },
  { key: 'Home', label: 'Home', x: 16 * STEP, y: 1 * STEP, width: U },
  { key: 'PageUp', label: 'PgUp', x: 17 * STEP, y: 1 * STEP, width: U },

  // 第2行：QWERTY
  { key: 'Tab', label: 'Tab', x: 0, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  { key: 'KeyQ', label: 'Q', x: 1.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyW', label: 'W', x: 2.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyE', label: 'E', x: 3.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyR', label: 'R', x: 4.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyT', label: 'T', x: 5.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyY', label: 'Y', x: 6.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyU', label: 'U', x: 7.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyI', label: 'I', x: 8.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyO', label: 'O', x: 9.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyP', label: 'P', x: 10.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketLeft', label: '[', x: 11.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketRight', label: ']', x: 12.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'Backslash', label: '\\', x: 13.5 * STEP + GAP * 0.5, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  // Del / End / PgDn
  { key: 'Delete', label: 'Del', x: 15 * STEP, y: 2 * STEP, width: U },
  { key: 'End', label: 'End', x: 16 * STEP, y: 2 * STEP, width: U },
  { key: 'PageDown', label: 'PgDn', x: 17 * STEP, y: 2 * STEP, width: U },

  // 第3行：ASDF
  { key: 'CapsLock', label: 'Caps', x: 0, y: 3 * STEP, width: 1.75 * U + GAP * 0.75 },
  { key: 'KeyA', label: 'A', x: 1.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyS', label: 'S', x: 2.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyD', label: 'D', x: 3.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyF', label: 'F', x: 4.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyG', label: 'G', x: 5.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyH', label: 'H', x: 6.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyJ', label: 'J', x: 7.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyK', label: 'K', x: 8.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyL', label: 'L', x: 9.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Semicolon', label: ';', x: 10.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Quote', label: "'", x: 11.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Enter', label: 'Enter', x: 12.75 * STEP + GAP * 0.75, y: 3 * STEP, width: 2.25 * U + GAP * 0.25 },

  // 第4行：ZXCV
  { key: 'ShiftLeft', label: 'Shift', x: 0, y: 4 * STEP, width: 2.25 * U + GAP * 0.25 },
  { key: 'KeyZ', label: 'Z', x: 2.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyX', label: 'X', x: 3.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyC', label: 'C', x: 4.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyV', label: 'V', x: 5.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyB', label: 'B', x: 6.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyN', label: 'N', x: 7.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyM', label: 'M', x: 8.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Comma', label: ',', x: 9.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Period', label: '.', x: 10.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Slash', label: '/', x: 11.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'ShiftRight', label: 'Shift', x: 12.25 * STEP + GAP * 0.25, y: 4 * STEP, width: 2.75 * U + GAP * 0.75 },
  // 方向键上
  { key: 'ArrowUp', label: '\u2191', x: 16 * STEP, y: 4 * STEP, width: U },

  // 第5行：空格行
  { key: 'ControlLeft', label: 'Ctrl', x: 0, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaLeft', label: 'Win', x: 1.25 * STEP + GAP * 0.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'AltLeft', label: 'Alt', x: 2.5 * STEP + GAP * 0.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'Space', label: '', x: 3.75 * STEP + GAP * 0.75, y: 5 * STEP, width: 6.25 * U + GAP * 1.25 },
  { key: 'AltRight', label: 'Alt', x: 10 * STEP + GAP * 2, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaRight', label: 'Win', x: 11.25 * STEP + GAP * 2.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ContextMenu', label: 'Fn', x: 12.5 * STEP + GAP * 2.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ControlRight', label: 'Ctrl', x: 13.75 * STEP + GAP * 2.75, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  // 方向键
  { key: 'ArrowLeft', label: '\u2190', x: 15 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowDown', label: '\u2193', x: 16 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowRight', label: '\u2192', x: 17 * STEP, y: 5 * STEP, width: U },
];

// ===== Full 键盘布局 (15U 主区 x 6行 + 右侧数字小键盘 4U 宽) =====
const layoutFull: KeyData[] = [
  // 第0行：F键行
  { key: 'Escape', label: 'Esc', x: 0, y: 0, width: U },
  { key: 'F1', label: 'F1', x: 1.5 * STEP, y: 0, width: U },
  { key: 'F2', label: 'F2', x: 2.5 * STEP, y: 0, width: U },
  { key: 'F3', label: 'F3', x: 3.5 * STEP, y: 0, width: U },
  { key: 'F4', label: 'F4', x: 4.5 * STEP, y: 0, width: U },
  { key: 'F5', label: 'F5', x: 6 * STEP, y: 0, width: U },
  { key: 'F6', label: 'F6', x: 7 * STEP, y: 0, width: U },
  { key: 'F7', label: 'F7', x: 8 * STEP, y: 0, width: U },
  { key: 'F8', label: 'F8', x: 9 * STEP, y: 0, width: U },
  { key: 'F9', label: 'F9', x: 10.5 * STEP, y: 0, width: U },
  { key: 'F10', label: 'F10', x: 11.5 * STEP, y: 0, width: U },
  { key: 'F11', label: 'F11', x: 12.5 * STEP, y: 0, width: U },
  { key: 'F12', label: 'F12', x: 13.5 * STEP, y: 0, width: U },
  // PrtSc / ScrLk / Pause
  { key: 'PrintScreen', label: 'PrtSc', x: 15 * STEP, y: 0, width: U },
  { key: 'ScrollLock', label: 'ScrLk', x: 16 * STEP, y: 0, width: U },
  { key: 'Pause', label: 'Pause', x: 17 * STEP, y: 0, width: U },
  // 数字小键盘
  { key: 'NumLock', label: 'Num', x: 18.5 * STEP, y: 0, width: U },
  { key: 'NumpadDivide', label: '/', x: 19.5 * STEP, y: 0, width: U },
  { key: 'NumpadMultiply', label: '*', x: 20.5 * STEP, y: 0, width: U },
  { key: 'NumpadSubtract', label: '-', x: 21.5 * STEP, y: 0, width: U },

  // 第1行：数字行
  { key: 'Backquote', label: '`', x: 0, y: 1 * STEP, width: U },
  { key: 'Digit1', label: '1', x: 1 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit2', label: '2', x: 2 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit3', label: '3', x: 3 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit4', label: '4', x: 4 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit5', label: '5', x: 5 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit6', label: '6', x: 6 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit7', label: '7', x: 7 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit8', label: '8', x: 8 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit9', label: '9', x: 9 * STEP, y: 1 * STEP, width: U },
  { key: 'Digit0', label: '0', x: 10 * STEP, y: 1 * STEP, width: U },
  { key: 'Minus', label: '-', x: 11 * STEP, y: 1 * STEP, width: U },
  { key: 'Equal', label: '=', x: 12 * STEP, y: 1 * STEP, width: U },
  { key: 'Backspace', label: 'Back', x: 13 * STEP, y: 1 * STEP, width: 2 * U + GAP },
  // Ins / Home / PgUp
  { key: 'Insert', label: 'Ins', x: 15 * STEP, y: 1 * STEP, width: U },
  { key: 'Home', label: 'Home', x: 16 * STEP, y: 1 * STEP, width: U },
  { key: 'PageUp', label: 'PgUp', x: 17 * STEP, y: 1 * STEP, width: U },
  // 数字小键盘 7 8 9 +
  { key: 'Numpad7', label: '7', x: 18.5 * STEP, y: 1 * STEP, width: U },
  { key: 'Numpad8', label: '8', x: 19.5 * STEP, y: 1 * STEP, width: U },
  { key: 'Numpad9', label: '9', x: 20.5 * STEP, y: 1 * STEP, width: U },
  { key: 'NumpadAdd', label: '+', x: 21.5 * STEP, y: 1 * STEP, width: U, height: 2 * STEP - GAP },

  // 第2行：QWERTY
  { key: 'Tab', label: 'Tab', x: 0, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  { key: 'KeyQ', label: 'Q', x: 1.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyW', label: 'W', x: 2.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyE', label: 'E', x: 3.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyR', label: 'R', x: 4.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyT', label: 'T', x: 5.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyY', label: 'Y', x: 6.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyU', label: 'U', x: 7.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyI', label: 'I', x: 8.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyO', label: 'O', x: 9.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'KeyP', label: 'P', x: 10.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketLeft', label: '[', x: 11.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'BracketRight', label: ']', x: 12.5 * STEP + GAP * 0.5, y: 2 * STEP, width: U },
  { key: 'Backslash', label: '\\', x: 13.5 * STEP + GAP * 0.5, y: 2 * STEP, width: 1.5 * U + GAP * 0.5 },
  // Del / End / PgDn
  { key: 'Delete', label: 'Del', x: 15 * STEP, y: 2 * STEP, width: U },
  { key: 'End', label: 'End', x: 16 * STEP, y: 2 * STEP, width: U },
  { key: 'PageDown', label: 'PgDn', x: 17 * STEP, y: 2 * STEP, width: U },
  // 数字小键盘 4 5 6
  { key: 'Numpad4', label: '4', x: 18.5 * STEP, y: 2 * STEP, width: U },
  { key: 'Numpad5', label: '5', x: 19.5 * STEP, y: 2 * STEP, width: U },
  { key: 'Numpad6', label: '6', x: 20.5 * STEP, y: 2 * STEP, width: U },

  // 第3行：ASDF
  { key: 'CapsLock', label: 'Caps', x: 0, y: 3 * STEP, width: 1.75 * U + GAP * 0.75 },
  { key: 'KeyA', label: 'A', x: 1.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyS', label: 'S', x: 2.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyD', label: 'D', x: 3.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyF', label: 'F', x: 4.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyG', label: 'G', x: 5.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyH', label: 'H', x: 6.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyJ', label: 'J', x: 7.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyK', label: 'K', x: 8.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'KeyL', label: 'L', x: 9.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Semicolon', label: ';', x: 10.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Quote', label: "'", x: 11.75 * STEP + GAP * 0.75, y: 3 * STEP, width: U },
  { key: 'Enter', label: 'Enter', x: 12.75 * STEP + GAP * 0.75, y: 3 * STEP, width: 2.25 * U + GAP * 0.25 },
  // 数字小键盘 1 2 3 Enter
  { key: 'Numpad1', label: '1', x: 18.5 * STEP, y: 3 * STEP, width: U },
  { key: 'Numpad2', label: '2', x: 19.5 * STEP, y: 3 * STEP, width: U },
  { key: 'Numpad3', label: '3', x: 20.5 * STEP, y: 3 * STEP, width: U },
  { key: 'NumpadEnter', label: 'Enter', x: 21.5 * STEP, y: 3 * STEP, width: U, height: 2 * STEP - GAP },

  // 第4行：ZXCV
  { key: 'ShiftLeft', label: 'Shift', x: 0, y: 4 * STEP, width: 2.25 * U + GAP * 0.25 },
  { key: 'KeyZ', label: 'Z', x: 2.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyX', label: 'X', x: 3.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyC', label: 'C', x: 4.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyV', label: 'V', x: 5.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyB', label: 'B', x: 6.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyN', label: 'N', x: 7.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'KeyM', label: 'M', x: 8.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Comma', label: ',', x: 9.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Period', label: '.', x: 10.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'Slash', label: '/', x: 11.25 * STEP + GAP * 0.25, y: 4 * STEP, width: U },
  { key: 'ShiftRight', label: 'Shift', x: 12.25 * STEP + GAP * 0.25, y: 4 * STEP, width: 2.75 * U + GAP * 0.75 },
  // 方向键上
  { key: 'ArrowUp', label: '\u2191', x: 16 * STEP, y: 4 * STEP, width: U },
  // 数字小键盘 0 .
  { key: 'Numpad0', label: '0', x: 18.5 * STEP, y: 4 * STEP, width: 2 * U + GAP },
  { key: 'NumpadDecimal', label: '.', x: 20.5 * STEP, y: 4 * STEP, width: U },

  // 第5行：空格行
  { key: 'ControlLeft', label: 'Ctrl', x: 0, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaLeft', label: 'Win', x: 1.25 * STEP + GAP * 0.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'AltLeft', label: 'Alt', x: 2.5 * STEP + GAP * 0.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'Space', label: '', x: 3.75 * STEP + GAP * 0.75, y: 5 * STEP, width: 6.25 * U + GAP * 1.25 },
  { key: 'AltRight', label: 'Alt', x: 10 * STEP + GAP * 2, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaRight', label: 'Win', x: 11.25 * STEP + GAP * 2.25, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ContextMenu', label: 'Fn', x: 12.5 * STEP + GAP * 2.5, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ControlRight', label: 'Ctrl', x: 13.75 * STEP + GAP * 2.75, y: 5 * STEP, width: 1.25 * U + GAP * 0.25 },
  // 方向键
  { key: 'ArrowLeft', label: '\u2190', x: 15 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowDown', label: '\u2193', x: 16 * STEP, y: 5 * STEP, width: U },
  { key: 'ArrowRight', label: '\u2192', x: 17 * STEP, y: 5 * STEP, width: U },
];

// ===== Laptop 键盘布局 (14U 宽 x 5行，紧凑型，无独立方向键区) =====
const layoutLaptop: KeyData[] = [
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
  { key: 'Backspace', label: 'Back', x: 13 * STEP, y: 0, width: U },

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
  { key: 'Backslash', label: '\\', x: 13.5 * STEP + GAP * 0.5, y: 1 * STEP, width: U },

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
  { key: 'Enter', label: 'Enter', x: 12.75 * STEP + GAP * 0.75, y: 2 * STEP, width: 1.25 * U + GAP * 0.25 },

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
  { key: 'ShiftRight', label: 'Shift', x: 12.25 * STEP + GAP * 0.25, y: 3 * STEP, width: 1.75 * U + GAP * 0.75 },

  // 第五行：空格行
  { key: 'ControlLeft', label: 'Ctrl', x: 0, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaLeft', label: 'Win', x: 1.25 * STEP + GAP * 0.25, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'AltLeft', label: 'Alt', x: 2.5 * STEP + GAP * 0.5, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'Space', label: '', x: 3.75 * STEP + GAP * 0.75, y: 4 * STEP, width: 5.25 * U + GAP * 1.25 },
  { key: 'AltRight', label: 'Alt', x: 9 * STEP + GAP * 2, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'MetaRight', label: 'Win', x: 10.25 * STEP + GAP * 2.25, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ContextMenu', label: 'Fn', x: 11.5 * STEP + GAP * 2.5, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
  { key: 'ControlRight', label: 'Ctrl', x: 12.75 * STEP + GAP * 2.75, y: 4 * STEP, width: 1.25 * U + GAP * 0.25 },
];

// ===== 导出所有布局 =====
export interface LayoutInfo {
  name: string;
  data: KeyData[];
  width: number;
  height: number;
}

export const keyLayouts: Record<string, LayoutInfo> = {
  '60%': {
    name: '60%',
    data: layout60,
    width: 15 * STEP - GAP,
    height: 5 * STEP - GAP,
  },
  '75%': {
    name: '75%',
    data: layout75,
    width: 18 * STEP - GAP,
    height: 6 * STEP - GAP,
  },
  'TKL': {
    name: 'TKL',
    data: layoutTKL,
    width: 18 * STEP - GAP,
    height: 6 * STEP - GAP,
  },
  'Full': {
    name: 'Full',
    data: layoutFull,
    width: 22.5 * STEP - GAP,
    height: 6 * STEP - GAP,
  },
  'Laptop': {
    name: 'Laptop',
    data: layoutLaptop,
    width: 14 * STEP - GAP,
    height: 5 * STEP - GAP,
  },
};

// 向后兼容的导出
export const keyLayout60 = layout60;
export const KEYBOARD_WIDTH = 15 * STEP - GAP;
export const KEYBOARD_HEIGHT = 5 * STEP - GAP;

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
  'F键': ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PrintScreen', 'ScrollLock', 'Pause'],
  '导航键': ['Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  '数字小键盘': ['NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract', 'NumpadAdd',
    'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6',
    'Numpad7', 'Numpad8', 'Numpad9', 'Numpad0', 'NumpadDecimal', 'NumpadEnter'],
};

// 获取按键所属区域
export function getKeyRegion(key: string): string {
  for (const [region, keys] of Object.entries(keyRegions)) {
    if (keys.includes(key)) return region;
  }
  return '其他';
}
