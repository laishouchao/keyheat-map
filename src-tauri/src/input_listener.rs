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

        db.create_session(&session_id, &chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string())?;

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
                // === 鼠标数据缓冲区 ===
                let mut mouse_move_count: u64 = 0;
                let mut last_mouse_position: Option<(i32, i32)> = None;
                let mut last_click_position: Option<(i32, i32)> = None; // 记录最近鼠标位置，用于点击坐标
                let mut pending_distance: f64 = 0.0; // 累积距离，定时批量写入
                let mut pending_positions: Vec<(i32, i32, String)> = Vec::with_capacity(100); // 位置缓冲
                let mut last_flush: std::time::Instant = std::time::Instant::now();
                let flush_interval = std::time::Duration::from_secs(1); // 每秒刷新一次

                loop {
                    if !processor_listening.load(Ordering::SeqCst) {
                        // 退出前刷新剩余数据
                        while let Ok(event) = rx.try_recv() {
                            Self::process_event_no_db(
                                &event,
                                &db_clone,
                                &session_id_arc,
                                &mut mouse_move_count,
                                &mut last_mouse_position,
                                &mut last_click_position,
                                &mut pending_distance,
                                &mut pending_positions,
                                &app_handle_clone,
                            );
                        }
                        // 最后一次刷新
                        Self::flush_mouse_data(&db_clone, &session_id_arc, &mut pending_distance, &mut pending_positions);
                        break;
                    }

                    match rx.recv_timeout(std::time::Duration::from_millis(50)) {
                        Ok(event) => {
                            Self::process_event_no_db(
                                &event,
                                &db_clone,
                                &session_id_arc,
                                &mut mouse_move_count,
                                &mut last_mouse_position,
                                &mut last_click_position,
                                &mut pending_distance,
                                &mut pending_positions,
                                &app_handle_clone,
                            );
                        }
                        Err(mpsc::RecvTimeoutError::Timeout) => {
                            // 定时刷新缓冲区到数据库
                            if last_flush.elapsed() >= flush_interval {
                                Self::flush_mouse_data(&db_clone, &session_id_arc, &mut pending_distance, &mut pending_positions);
                                last_flush = std::time::Instant::now();
                            }
                        }
                        Err(mpsc::RecvTimeoutError::Disconnected) => {
                            Self::flush_mouse_data(&db_clone, &session_id_arc, &mut pending_distance, &mut pending_positions);
                            break;
                        }
                    }
                }
            })
            .map_err(|e| format!("启动事件处理线程失败: {}", e))?;

        self.processor_thread = Some(processor_thread);

        // 启动 rdev 监听线程（rdev::listen 是阻塞的）
        let listener_is_listening = Arc::clone(&self.is_listening);
        let modifiers_arc = Arc::clone(&self.pressed_modifiers);
        let last_pos_in_callback = Arc::new(std::sync::Mutex::new((0i32, 0i32)));
        let last_pos_clone = Arc::clone(&last_pos_in_callback);
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
                            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

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
                            let (cx, cy) = last_pos_clone.lock().map(|p| *p).unwrap_or((0, 0));
                            match button {
                                rdev::Button::Left | rdev::Button::Right | rdev::Button::Middle => {
                                    let _ = tx.send(InputEvent::MouseClick {
                                        x: cx,
                                        y: cy,
                                        timestamp: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                                    });
                                }
                                _ => {}
                            }
                        }
                        rdev::EventType::ButtonRelease(_button) => {
                            // 忽略鼠标释放事件
                        }
                        rdev::EventType::MouseMove { x, y } => {
                            // 更新共享的最近位置（供 ButtonPress/Wheel 使用）
                            if let Ok(mut pos) = last_pos_clone.lock() {
                                *pos = (x as i32, y as i32);
                            }
                            let _ = tx.send(InputEvent::MouseMove {
                                x: x as i32,
                                y: y as i32,
                                distance: 0.0, // 距离在处理线程中计算
                                timestamp: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                            });
                        }
                        rdev::EventType::Wheel { delta_x: _, delta_y: _ } => {
                            let (cx, cy) = last_pos_clone.lock().map(|p| *p).unwrap_or((0, 0));
                            let _ = tx.send(InputEvent::MouseScroll {
                                x: cx,
                                y: cy,
                                timestamp: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                            });
                        }
                    };
                });
            })
            .map_err(|e| format!("启动输入监听线程失败: {}", e))?;

        self.listener_thread = Some(listener_thread);

        Ok(())
    }

    /// 处理单个事件（键盘直接写DB，鼠标走内存缓冲区）
    fn process_event_no_db(
        event: &InputEvent,
        db: &Database,
        session_id: &Arc<std::sync::Mutex<String>>,
        mouse_move_count: &mut u64,
        last_mouse_position: &mut Option<(i32, i32)>,
        last_click_position: &mut Option<(i32, i32)>,
        pending_distance: &mut f64,
        pending_positions: &mut Vec<(i32, i32, String)>,
        app_handle: &tauri::AppHandle,
    ) {
        match event {
            InputEvent::KeyPress {
                key_name,
                key_code,
                timestamp,
            } => {
                // 键盘事件频率低，直接写数据库
                let sid = match session_id.lock() {
                    Ok(s) => s.clone(),
                    Err(_) => return,
                };
                if let Err(e) = db.insert_key_event(key_name, *key_code, timestamp, &sid) {
                    eprintln!("记录按键失败: {}", e);
                }
                let _ = app_handle.emit_all("key-highlight-on", key_name);
                let _ = app_handle.emit_all("input-event", "key_press");
            }
            InputEvent::KeyRelease { key_name } => {
                let _ = app_handle.emit_all("key-highlight-off", key_name);
            }
            InputEvent::ComboKeyPress { combo_name, timestamp } => {
                let sid = match session_id.lock() {
                    Ok(s) => s.clone(),
                    Err(_) => return,
                };
                if let Err(e) = db.insert_combo_event(combo_name, timestamp, &sid) {
                    eprintln!("记录组合键失败: {}", e);
                }
                let _ = app_handle.emit_all("input-event", "combo_key_press");
            }
            InputEvent::MouseClick { x, y, timestamp } => {
                // 使用最近记录的鼠标位置作为点击坐标（rdev ButtonPress 不带坐标）
                let (cx, cy) = last_click_position.unwrap_or((*x, *y));
                let sid = match session_id.lock() {
                    Ok(s) => s.clone(),
                    Err(_) => return,
                };
                if let Err(e) = db.insert_mouse_event("click", cx, cy, timestamp, &sid) {
                    eprintln!("记录鼠标点击失败: {}", e);
                }
                // 将点击位置也加入轨迹
                pending_positions.push((cx, cy, timestamp.clone()));
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
                if let Some((lx, ly)) = *last_mouse_position {
                    let dx = (*x - lx) as f64;
                    let dy = (*y - ly) as f64;
                    let dist = (dx * dx + dy * dy).sqrt();
                    *pending_distance += dist;
                }

                // 更新位置
                *last_mouse_position = Some((*x, *y));
                *last_click_position = Some((*x, *y));

                // 每5次记录一个位置点（减少数据量但保留轨迹形状）
                if *mouse_move_count % 5 == 0 {
                    pending_positions.push((*x, *y, timestamp.clone()));
                }

                // 每10次推送一次前端事件
                if *mouse_move_count % 10 == 0 {
                    let _ = app_handle.emit_all("input-event", "mouse_move");
                }
            }
            InputEvent::MouseScroll { x, y, timestamp } => {
                let sid = match session_id.lock() {
                    Ok(s) => s.clone(),
                    Err(_) => return,
                };
                if let Err(e) = db.insert_mouse_event("scroll", *x, *y, timestamp, &sid) {
                    eprintln!("记录滚轮失败: {}", e);
                }
                let _ = app_handle.emit_all("input-event", "mouse_scroll");
            }
        }
    }

    /// 将缓冲的鼠标数据批量写入数据库（每秒调用一次）
    fn flush_mouse_data(
        db: &Database,
        session_id: &Arc<std::sync::Mutex<String>>,
        pending_distance: &mut f64,
        pending_positions: &mut Vec<(i32, i32, String)>,
    ) {
        if *pending_distance < 0.01 && pending_positions.is_empty() {
            return;
        }

        let sid = match session_id.lock() {
            Ok(s) => s.clone(),
            Err(_) => return,
        };

        // 批量写入距离
        if *pending_distance >= 0.01 {
            if let Err(e) = db.update_session_distance(&sid, *pending_distance) {
                eprintln!("批量写入距离失败: {}", e);
            }
            // 按天累加距离
            if let Err(e) = db.update_daily_distance(*pending_distance) {
                eprintln!("按天写入距离失败: {}", e);
            }
            *pending_distance = 0.0;
        }

        // 批量写入位置
        if !pending_positions.is_empty() {
            if let Err(e) = db.batch_insert_mouse_positions(&pending_positions, &sid) {
                eprintln!("批量写入位置失败: {}", e);
            }
            pending_positions.clear();
        }
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
            db.end_session(&session_id_str, &chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string())?;
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
        // 数字键：rdev 用 Num0-9，前端用 Digit0-9
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
        // 特殊键
        "Return" => "Enter".to_string(),
        "Backspace" => "Backspace".to_string(),
        "Delete" => "Delete".to_string(),
        "Insert" => "Insert".to_string(),
        "Home" => "Home".to_string(),
        "End" => "End".to_string(),
        "PageUp" => "PageUp".to_string(),
        "PageDown" => "PageDown".to_string(),
        "PrintScreen" => "PrintScreen".to_string(),
        "ScrollLock" => "ScrollLock".to_string(),
        "Pause" => "Pause".to_string(),
        "NumLock" => "NumLock".to_string(),
        "CapsLock" => "CapsLock".to_string(),
        "Space" => "Space".to_string(),
        "Tab" => "Tab".to_string(),
        "Escape" => "Escape".to_string(),
        // Alt 键
        "Alt" => "AltLeft".to_string(),
        "AltGr" => "AltRight".to_string(),
        // 符号键：rdev 用不同名称
        "BackQuote" => "Backquote".to_string(),
        "BackSlash" => "Backslash".to_string(),
        "IntlBackslash" => "Backslash".to_string(),
        "LeftBracket" => "BracketLeft".to_string(),
        "RightBracket" => "BracketRight".to_string(),
        "SemiColon" => "Semicolon".to_string(),
        "Quote" => "Quote".to_string(),
        "Comma" => "Comma".to_string(),
        "Dot" => "Period".to_string(),
        "Slash" => "Slash".to_string(),
        "Minus" => "Minus".to_string(),
        "Equal" => "Equal".to_string(),
        // Meta / Win 键
        "MetaLeft" => "MetaLeft".to_string(),
        "MetaRight" => "MetaRight".to_string(),
        "ContextMenu" => "ContextMenu".to_string(),
        // 方向键
        "UpArrow" => "ArrowUp".to_string(),
        "DownArrow" => "ArrowDown".to_string(),
        "LeftArrow" => "ArrowLeft".to_string(),
        "RightArrow" => "ArrowRight".to_string(),
        // 数字小键盘：rdev 用 KpX，前端用 NumpadX
        "Kp0" => "Numpad0".to_string(),
        "Kp1" => "Numpad1".to_string(),
        "Kp2" => "Numpad2".to_string(),
        "Kp3" => "Numpad3".to_string(),
        "Kp4" => "Numpad4".to_string(),
        "Kp5" => "Numpad5".to_string(),
        "Kp6" => "Numpad6".to_string(),
        "Kp7" => "Numpad7".to_string(),
        "Kp8" => "Numpad8".to_string(),
        "Kp9" => "Numpad9".to_string(),
        "KpDelete" => "NumpadDecimal".to_string(),
        "KpReturn" => "NumpadEnter".to_string(),
        "KpMinus" => "NumpadSubtract".to_string(),
        "KpPlus" => "NumpadAdd".to_string(),
        "KpMultiply" => "NumpadMultiply".to_string(),
        "KpDivide" => "NumpadDivide".to_string(),
        // 其他：直接使用 Debug 名称（适用于 KeyA-KeyZ, ShiftLeft/Right, ControlLeft/Right, F1-F12 等）
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
