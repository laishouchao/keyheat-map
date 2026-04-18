use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Arc;
use std::thread::{self, JoinHandle};

use crate::db::Database;

/// 输入事件类型
#[derive(Debug, Clone)]
pub enum InputEvent {
    KeyPress {
        key_name: String,
        key_code: Option<i32>,
        timestamp: String,
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
    pub fn start(&mut self, db: Arc<Database>) -> Result<(), String> {
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
        let processor_thread = thread::Builder::new()
            .name("input-processor".to_string())
            .spawn(move || {
                // 鼠标位置采样控制：每隔一定次数记录一次鼠标位置
                let mut mouse_move_count: u64 = 0;
                let mouse_position_sample_rate: u64 = 10; // 每10次鼠标移动记录一次位置

                loop {
                    if !processor_listening.load(Ordering::SeqCst) {
                        // 处理剩余事件
                        while let Ok(event) = rx.try_recv() {
                            if let Err(e) = Self::process_event(&event, &db_clone, &session_id_arc, &mut mouse_move_count, mouse_position_sample_rate) {
                                eprintln!("处理事件失败: {}", e);
                            }
                        }
                        break;
                    }

                    match rx.recv_timeout(std::time::Duration::from_millis(100)) {
                        Ok(event) => {
                            if let Err(e) = Self::process_event(&event, &db_clone, &session_id_arc, &mut mouse_move_count, mouse_position_sample_rate) {
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
                            let key_name = format!("{:?}", key);
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
                                            // 按固定顺序排列修饰键：Ctrl, Shift, Alt, AltGr, Meta
                                            let mut sorted_mods = mods.clone();
                                            let order = ["Ctrl", "Shift", "Alt", "AltGr", "Meta"];
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
                            // 如果是修饰键，从 pressed_modifiers 中移除
                            if is_modifier_key(&key) {
                                let label = get_modifier_label(&key);
                                if let Ok(mut mods) = modifiers_arc.lock() {
                                    mods.retain(|m| m != label);
                                }
                            }
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
            }
            InputEvent::ComboKeyPress { combo_name, timestamp } => {
                db.insert_combo_event(combo_name, timestamp, &session_id_str)?;
            }
            InputEvent::MouseClick { x, y, timestamp } => {
                db.insert_mouse_event("click", *x, *y, timestamp, &session_id_str)?;
                db.insert_mouse_position(*x, *y, timestamp, &session_id_str)?;
            }
            InputEvent::MouseMove {
                x,
                y,
                distance: _,
                timestamp,
            } => {
                *mouse_move_count += 1;
                // 按采样率记录鼠标位置，避免数据库膨胀
                if *mouse_move_count % mouse_position_sample_rate == 0 {
                    db.insert_mouse_position(*x, *y, timestamp, &session_id_str)?;
                }
            }
            InputEvent::MouseScroll { x, y, timestamp } => {
                db.insert_mouse_event("scroll", *x, *y, timestamp, &session_id_str)?;
                db.insert_mouse_position(*x, *y, timestamp, &session_id_str)?;
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

/// 判断是否是修饰键
fn is_modifier_key(key: &rdev::Key) -> bool {
    matches!(key,
        rdev::Key::ShiftLeft | rdev::Key::ShiftRight |
        rdev::Key::ControlLeft | rdev::Key::ControlRight |
        rdev::Key::Alt | rdev::Key::AltGr |
        rdev::Key::MetaLeft | rdev::Key::MetaRight
    )
}

/// 获取修饰键的标签名称
fn get_modifier_label(key: &rdev::Key) -> &'static str {
    match key {
        rdev::Key::ShiftLeft | rdev::Key::ShiftRight => "Shift",
        rdev::Key::ControlLeft | rdev::Key::ControlRight => "Ctrl",
        rdev::Key::Alt => "Alt",
        rdev::Key::AltGr => "AltGr",
        rdev::Key::MetaLeft | rdev::Key::MetaRight => "Meta",
        _ => "",
    }
}

/// 获取按键的显示标签
fn get_key_label(key: &rdev::Key) -> String {
    let name = format!("{:?}", key);
    // 清理名称：移除 "Key" 和 "Num" 前缀
    name.replace("Key", "").replace("Num", "")
}
