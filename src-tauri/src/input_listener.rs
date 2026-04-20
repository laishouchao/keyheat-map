use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Arc;
use std::thread::{self, JoinHandle};

use crate::db::Database;
use tauri::Manager;

/// 输入事件类型
#[derive(Debug, Clone)]
pub enum InputEvent {
    KeyPress {
        key_name: String,
        key_code: Option<i32>,
        timestamp: String,
    },
    KeyRelease {
        key_name: String,
    },
    ComboKeyPress {
        combo_name: String,
        timestamp: String,
    },
    MouseClick {
        x: i32,
        y: i32,
        timestamp: String,
    },
    MouseMove {
        x: i32,
        y: i32,
        distance: f64,
        timestamp: String,
    },
    MouseScroll {
        x: i32,
        y: i32,
        timestamp: String,
    },
}

/// 输入监听器，管理全局键盘和鼠标事件的监听
pub struct InputListener {
    /// 监听线程句柄
    listener_thread: Option<JoinHandle<()>>,
    /// 事件处理线程句柄
    processor_thread: Option<JoinHandle<()>>,
    /// 是否正在监听
    is_listening: Arc<AtomicBool>,
    /// 发送事件到处理线程的通道
    event_tx: Option<Sender<InputEvent>>,
    /// 当前会话 ID
    session_id: Arc<std::sync::Mutex<String>>,
    /// 当前按下的修饰键（用于组合键检测）
    pressed_modifiers: Arc<std::sync::Mutex<Vec<String>>>,
}

impl InputListener {
    /// 创建新的输入监听器
    pub fn new() -> Self {
        Self {
            listener_thread: None,
            processor_thread: None,
            is_listening: Arc::new(AtomicBool::new(false)),
            event_tx: None,
            session_id: Arc::new(std::sync::Mutex::new(String::new())),
            pressed_modifiers: Arc::new(std::sync::Mutex::new(Vec::new())),
        }
    }

    /// 启动输入监听
    pub fn start(&mut self, db: Arc<Database>, app_handle: tauri::AppHandle) -> Result<(), String> {
        if self.is_listening.load(Ordering::SeqCst) {
            return Ok(());
        }

        // 创建新会话
        let session_id = format!(
            "{}",
            chrono::Local::now().format("%Y%m%d_%H%M%S")
        );
        {
            let mut sid = self.session_id.lock().map_err(|e| e.to_string())?;
            *sid = session_id.clone();
        }

        db.create_session(&session_id, &chrono::Local::now().to_rfc3339())?;

        // 创建事件通道
        let (tx, rx): (Sender<InputEvent>, Receiver<InputEvent>) = mpsc::channel();
        self.event_tx = Some(tx.clone());

        // 设置监听标志
        self.is_listening.store(true, Ordering::SeqCst);
        let _is_listening = Arc::clone(&self.is_listening);
        let session_id_arc = Arc::clone(&self.session_id);

        // 启动事件处理线程
        let db_clone = Arc::clone(&db);
        let processor_listening = Arc::clone(&self.is_listening);
        let app_handle_clone = app_handle.clone();
        let processor_thread = thread::Builder::new()
            .name("input-processor".to_string())
            .spawn(move || {
                // 鼠标位置采样控制：每隔一定次数记录一次鼠标位置
                let mut mouse_move_count: u64 = 0;
                let mouse_position_sample_rate: u64 = 10; // 每10次鼠标移动记录一次位置
                let mut last_mouse_position: Option<(i32, i32)> = None;

                loop {
                    if !processor_listening.load(Ordering::SeqCst) {
                        // 处理剩余事件
                        while let Ok(event) = rx.try_recv() {
                            if let Err(e) = Self::process_event(&event, &db_clone, &session_id_arc, &mut mouse_move_count, mouse_position_sample_rate, &mut last_mouse_position, &app_handle_clone) {
                                eprintln!("处理事件失败: {}", e);
                            }
                        }
                        break;
                    }

                    match rx.recv_timeout(std::time::Duration::from_millis(100)) {
                        Ok(event) => {
                            if let Err(e) = Self::process_event(&event, &db_clone, &session_id_arc, &mut mouse_move_count, mouse_position_sample_rate, &mut last_mouse_position, &app_handle_clone) {
                                eprintln!("处理事件失败: {}", e);
                            }
                        }
                        Err(mpsc::RecvTimeoutError::Timeout) => continue,
                        Err(mpsc::RecvTimeoutError::Disconnected) => break,
                    }
                }
            })
            .map_err(|e| format!("启动事件处理线程失败: {}", e))?;

        self.processor_thread = Some(processor_thread);

        // 启动 rdev 监听线程（rdev::listen 是阻塞的）
        let listener_is_listening = Arc::clone(&self.is_listening);
        let modifiers_arc = Arc::clone(&self.pressed_modifiers);
        let listener_thread = thread::Builder::new()
            .name("input-listener".to_string())
            .spawn(move || {
                // 使用 rdev::listen 在单独线程中运行
                // 回调函数会在每次输入事件时被调用
                let _result = rdev::listen(move |event| {
                    if !listener_is_listening.load(Ordering::SeqCst) {
                        // rdev 0.5 不支持通过返回值停止监听，使用标志位
                        return;
                    }

                    // rdev 0.5 中 Event 只有 time, name, event_type 三个字段
                    // 鼠标位置需要从 EventType::MouseMove 中获取
                    match event.event_type {
                        rdev::EventType::KeyPress(key) => {
                            let key_name = normalize_key_name(&key);
                            let key_code = key_to_code(&key);
                            let timestamp = chrono::Local::now().to_rfc3339();

                            // 检查是否是修饰键
                            if is_modifier_key(&key) {
                                // 添加到已按下的修饰键列表
                                let label = get_modifier_label(&key).to_string();
                                if let Ok(mut mods) = modifiers_arc.lock() {
                                    if !mods.contains(&label) {
                                        mods.push(label);
                                    }
                                }
                            } else {
                                // 非修饰键：检查是否有修饰键按下，组成组合键
                                let combo_name = {
                                    if let Ok(mods) = modifiers_arc.lock() {
                                        if !mods.is_empty() {
                                            // 按固定顺序排列修饰键：Ctrl, Shift, Alt, AltGr
                                            let mut sorted_mods = mods.clone();
                                            let order = ["Ctrl", "Shift", "Alt", "AltGr"];
                                            sorted_mods.sort_by_key(|m| {
                                                order.iter().position(|&o| o == *m).unwrap_or(999)
                                            });
                                            let key_label = get_key_label(&key);
                                            Some(format!("{}+{}", sorted_mods.join("+"), key_label))
                                        } else {
                                            None
                                        }
                                    } else {
                                        None
                                    }
                                };

                                // 发送组合键事件（如果存在）
                                if let Some(combo) = combo_name {
                                    let _ = tx.send(InputEvent::ComboKeyPress {
                                        combo_name: combo,
                                        timestamp: timestamp.clone(),
                                    });
                                }
                            }

                            // 同时发送普通的 KeyPress 事件
                            let _ = tx.send(InputEvent::KeyPress {
                                key_name,
                                key_code,
                                timestamp,
                            });
                        }
                        rdev::EventType::KeyRelease(key) => {
                            let key_name = normalize_key_name(&key);

                            // 如果是修饰键，从 pressed_modifiers 中移除
                            if is_modifier_key(&key) {
                                let label = get_modifier_label(&key);
                                if let Ok(mut mods) = modifiers_arc.lock() {
                                    mods.retain(|m| m != label);
                                }
                            }

                            // 发送按键释放事件（用于前端高亮）
                            let _ = tx.send(InputEvent::KeyRelease {
                                key_name,
                            });
                        }
                        rdev::EventType::ButtonPress(button) => {
                            // rdev 0.5 中 Event 没有 position 字段
                            // 鼠标点击时无法直接获取坐标，使用 (0, 0) 作为占位
                            match button {
                                rdev::Button::Left | rdev::Button::Right | rdev::Button::Middle => {
                                    let _ = tx.send(InputEvent::MouseClick {
                                        x: 0,
                                        y: 0,
                                        timestamp: chrono::Local::now().to_rfc3339(),
                                    });
                                }
                                _ => {}
                            }
                        }
                        rdev::EventType::ButtonRelease(_button) => {
                            // 忽略鼠标释放事件
                        }
                        rdev::EventType::MouseMove { x, y } => {
                            let _ = tx.send(InputEvent::MouseMove {
                                x: x as i32,
                                y: y as i32,
                                distance: 0.0, // 距离在处理线程中计算
                                timestamp: chrono::Local::now().to_rfc3339(),
                            });
                        }
                        rdev::EventType::Wheel { delta_x: _, delta_y: _ } => {
                            // rdev 0.5 中 Event 没有 position 字段
                            // 滚轮事件无法直接获取坐标，使用 (0, 0) 作为占位
                            let _ = tx.send(InputEvent::MouseScroll {
                                x: 0,
                                y: 0,
                                timestamp: chrono::Local::now().to_rfc3339(),
                            });
                        }
                    };
                });
            })
            .map_err(|e| format!("启动输入监听线程失败: {}", e))?;

        self.listener_thread = Some(listener_thread);

        Ok(())
    }

    /// 处理单个事件
    fn process_event(
        event: &InputEvent,
        db: &Database,
        session_id: &Arc<std::sync::Mutex<String>>,
        mouse_move_count: &mut u64,
        mouse_position_sample_rate: u64,
        last_mouse_position: &mut Option<(i32, i32)>,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), String> {
        let sid = session_id.lock().map_err(|e| e.to_string())?;
        let session_id_str = sid.clone();
        drop(sid); // 尽快释放锁

        match event {
            InputEvent::KeyPress {
                key_name,
                key_code,
                timestamp,
            } => {
                db.insert_key_event(key_name, *key_code, timestamp, &session_id_str)?;
                // 推送按键高亮事件（前端用于实时高亮显示）
                let _ = app_handle.emit_all("key-highlight-on", key_name);
                // 推送数据刷新事件
                let _ = app_handle.emit_all("input-event", "key_press");
            }
            InputEvent::KeyRelease { key_name } => {
                // 推送按键释放高亮事件
                let _ = app_handle.emit_all("key-highlight-off", key_name);
            }
            InputEvent::ComboKeyPress { combo_name, timestamp } => {
                db.insert_combo_event(combo_name, timestamp, &session_id_str)?;
                let _ = app_handle.emit_all("input-event", "combo_key_press");
            }
            InputEvent::MouseClick { x, y, timestamp } => {
                db.insert_mouse_event("click", *x, *y, timestamp, &session_id_str)?;
                db.insert_mouse_position(*x, *y, timestamp, &session_id_str)?;
                let _ = app_handle.emit_all("input-event", "mouse_click");
            }
            InputEvent::MouseMove {
                x,
                y,
                distance: _,
                timestamp,
            } => {
                *mouse_move_count += 1;

                // 计算移动距离
                let move_distance = if let Some((last_x, last_y)) = *last_mouse_position {
                    let dx = (*x - last_x) as f64;
                    let dy = (*y - last_y) as f64;
                    (dx * dx + dy * dy).sqrt()
                } else {
                    0.0
                };

                // 更新上一次位置
                *last_mouse_position = Some((*x, *y));

                // 累积到会话总距离（忽略错误，不影响位置记录）
                if move_distance > 0.0 {
                    let _ = db.update_session_distance(&session_id_str, move_distance);
                }

                // 按采样率记录鼠标位置，避免数据库膨胀
                if *mouse_move_count % mouse_position_sample_rate == 0 {
                    if let Err(e) = db.insert_mouse_position(*x, *y, timestamp, &session_id_str) {
                        eprintln!("记录鼠标位置失败: {}", e);
                    }
                }

                // MouseMove 事件太频繁，每 10 次才推送一次
                if *mouse_move_count % 10 == 0 {
                    let _ = app_handle.emit_all("input-event", "mouse_move");
                }
            }
            InputEvent::MouseScroll { x, y, timestamp } => {
                db.insert_mouse_event("scroll", *x, *y, timestamp, &session_id_str)?;
                db.insert_mouse_position(*x, *y, timestamp, &session_id_str)?;
                let _ = app_handle.emit_all("input-event", "mouse_scroll");
            }
        }

        Ok(())
    }

    /// 停止输入监听
    pub fn stop(&mut self, db: &Database) -> Result<(), String> {
        if !self.is_listening.load(Ordering::SeqCst) {
            return Ok(());
        }

        self.is_listening.store(false, Ordering::SeqCst);

        // 结束当前会话
        let sid = self.session_id.lock().map_err(|e| e.to_string())?;
        let session_id_str = sid.clone();
        drop(sid);

        if !session_id_str.is_empty() {
            db.end_session(&session_id_str, &chrono::Local::now().to_rfc3339())?;
        }

        // 等待处理线程结束
        if let Some(thread) = self.processor_thread.take() {
            let _ = thread.join();
        }

        // 等待监听线程结束（rdev::listen 是阻塞的，需要通过标志位退出）
        // 注意：rdev 0.5 的 listen 函数没有提供优雅退出的方式
        // 线程会在进程退出时自动终止
        self.listener_thread.take();

        Ok(())
    }

    /// 检查是否正在监听
    pub fn is_running(&self) -> bool {
        self.is_listening.load(Ordering::SeqCst)
    }

    /// 获取当前会话 ID
    pub fn get_session_id(&self) -> Result<String, String> {
        let sid = self.session_id.lock().map_err(|e| e.to_string())?;
        Ok(sid.clone())
    }
}

/// 将 rdev 的 key 名称统一映射为标准格式（与前端 keyLayout.ts 保持一致）
fn normalize_key_name(key: &rdev::Key) -> String {
    let raw = format!("{:?}", key);
    match raw.as_str() {
        "Num0" => "Digit0".to_string(),
        "Num1" => "Digit1".to_string(),
        "Num2" => "Digit2".to_string(),
        "Num3" => "Digit3".to_string(),
        "Num4" => "Digit4".to_string(),
        "Num5" => "Digit5".to_string(),
        "Num6" => "Digit6".to_string(),
        "Num7" => "Digit7".to_string(),
        "Num8" => "Digit8".to_string(),
        "Num9" => "Digit9".to_string(),
        "Return" => "Enter".to_string(),
        "Alt" => "AltLeft".to_string(),
        "AltGr" => "AltRight".to_string(),
        "BackQuote" => "Backquote".to_string(),
        "BackSlash" => "Backslash".to_string(),
        "LeftBracket" => "BracketLeft".to_string(),
        "RightBracket" => "BracketRight".to_string(),
        "Semicolon" => "Semicolon".to_string(),
        "Quote" => "Quote".to_string(),
        "Comma" => "Comma".to_string(),
        "Period" => "Period".to_string(),
        "Slash" => "Slash".to_string(),
        "Minus" => "Minus".to_string(),
        "Equal" => "Equal".to_string(),
        "CapsLock" => "CapsLock".to_string(),
        "MetaLeft" => "MetaLeft".to_string(),
        "MetaRight" => "MetaRight".to_string(),
        "ContextMenu" => "ContextMenu".to_string(),
        "UpArrow" => "ArrowUp".to_string(),
        "DownArrow" => "ArrowDown".to_string(),
        "LeftArrow" => "ArrowLeft".to_string(),
        "RightArrow" => "ArrowRight".to_string(),
        _ => raw,
    }
}

/// 将 rdev::Key 转换为键码
fn key_to_code(key: &rdev::Key) -> Option<i32> {
    // rdev 0.5 中 Key 枚举没有直接的键码字段
    // 我们可以根据 Key 变体名称来映射
    let code = match key {
        rdev::Key::Num0 => 48,
        rdev::Key::Num1 => 49,
        rdev::Key::Num2 => 50,
        rdev::Key::Num3 => 51,
        rdev::Key::Num4 => 52,
        rdev::Key::Num5 => 53,
        rdev::Key::Num6 => 54,
        rdev::Key::Num7 => 55,
        rdev::Key::Num8 => 56,
        rdev::Key::Num9 => 57,
        rdev::Key::KeyA => 65,
        rdev::Key::KeyB => 66,
        rdev::Key::KeyC => 67,
        rdev::Key::KeyD => 68,
        rdev::Key::KeyE => 69,
        rdev::Key::KeyF => 70,
        rdev::Key::KeyG => 71,
        rdev::Key::KeyH => 72,
        rdev::Key::KeyI => 73,
        rdev::Key::KeyJ => 74,
        rdev::Key::KeyK => 75,
        rdev::Key::KeyL => 76,
        rdev::Key::KeyM => 77,
        rdev::Key::KeyN => 78,
        rdev::Key::KeyO => 79,
        rdev::Key::KeyP => 80,
        rdev::Key::KeyQ => 81,
        rdev::Key::KeyR => 82,
        rdev::Key::KeyS => 83,
        rdev::Key::KeyT => 84,
        rdev::Key::KeyU => 85,
        rdev::Key::KeyV => 86,
        rdev::Key::KeyW => 87,
        rdev::Key::KeyX => 88,
        rdev::Key::KeyY => 89,
        rdev::Key::KeyZ => 90,
        rdev::Key::F1 => 112,
        rdev::Key::F2 => 113,
        rdev::Key::F3 => 114,
        rdev::Key::F4 => 115,
        rdev::Key::F5 => 116,
        rdev::Key::F6 => 117,
        rdev::Key::F7 => 118,
        rdev::Key::F8 => 119,
        rdev::Key::F9 => 120,
        rdev::Key::F10 => 121,
        rdev::Key::F11 => 122,
        rdev::Key::F12 => 123,
        rdev::Key::Space => 32,
        rdev::Key::Return => 13,
        rdev::Key::Tab => 9,
        rdev::Key::ShiftLeft => 16,
        rdev::Key::ShiftRight => 16,
        rdev::Key::ControlLeft => 17,
        rdev::Key::ControlRight => 17,
        rdev::Key::Alt => 18,
        rdev::Key::MetaLeft => 91,
        rdev::Key::MetaRight => 92,
        rdev::Key::CapsLock => 20,
        rdev::Key::Escape => 27,
        rdev::Key::Backspace => 8,
        rdev::Key::Delete => 46,
        rdev::Key::Insert => 45,
        rdev::Key::Home => 36,
        rdev::Key::End => 35,
        rdev::Key::PageUp => 33,
        rdev::Key::PageDown => 34,
        rdev::Key::UpArrow => 38,
        rdev::Key::DownArrow => 40,
        rdev::Key::LeftArrow => 37,
        rdev::Key::RightArrow => 39,
        _ => return None,
    };
    Some(code)
}

/// 判断是否是修饰键（排除 Meta 键，因为 Win 键的 release 不可靠）
fn is_modifier_key(key: &rdev::Key) -> bool {
    matches!(key,
        rdev::Key::ShiftLeft | rdev::Key::ShiftRight |
        rdev::Key::ControlLeft | rdev::Key::ControlRight |
        rdev::Key::Alt | rdev::Key::AltGr
        // 注意：不包含 MetaLeft / MetaRight，避免 Win 键卡住
    )
}

/// 获取修饰键的标签名称
fn get_modifier_label(key: &rdev::Key) -> &'static str {
    match key {
        rdev::Key::ShiftLeft | rdev::Key::ShiftRight => "Shift",
        rdev::Key::ControlLeft | rdev::Key::ControlRight => "Ctrl",
        rdev::Key::Alt => "Alt",
        rdev::Key::AltGr => "AltGr",
        _ => "",
    }
}

/// 获取按键的显示标签
fn get_key_label(key: &rdev::Key) -> String {
    let name = normalize_key_name(key);
    // 清理名称：移除 "Key" 和 "Digit" 前缀
    name.replace("Key", "").replace("Digit", "")
}
