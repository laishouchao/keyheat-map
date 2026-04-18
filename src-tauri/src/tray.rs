use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

use crate::commands::AppState;

/// 创建系统托盘
pub fn create_system_tray() -> SystemTray {
    let show_hide = CustomMenuItem::new("show_hide", "显示/隐藏窗口");
    let separator1 = SystemTrayMenuItem::Separator;
    let toggle_record = CustomMenuItem::new("toggle_record", "暂停记录");
    let separator2 = SystemTrayMenuItem::Separator;
    let quit = CustomMenuItem::new("quit", "退出");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show_hide)
        .add_native_item(separator1)
        .add_item(toggle_record)
        .add_native_item(separator2)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

/// 处理系统托盘事件
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            // 左键点击托盘图标：显示/隐藏窗口
            toggle_window_visibility(app);
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show_hide" => {
                toggle_window_visibility(app);
            }
            "toggle_record" => {
                toggle_recording_from_tray(app);
            }
            "quit" => {
                // 退出应用
                app.exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

/// 切换窗口可见性
fn toggle_window_visibility(app: &AppHandle) {
    if let Some(window) = app.get_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

/// 从托盘切换录制状态
fn toggle_recording_from_tray(app: &AppHandle) {
    if let Some(state) = app.try_state::<AppState>() {
        let listener = match state.listener.lock() {
            Ok(l) => l,
            Err(_) => return,
        };

        let is_running = listener.is_running();
        drop(listener);

        if is_running {
            if let Ok(mut listener) = state.listener.lock() {
                let _ = listener.stop(&state.db);
            }
        } else {
            if let Ok(mut listener) = state.listener.lock() {
                let _ = listener.start(std::sync::Arc::clone(&state.db));
            }
        }

        // 更新托盘菜单文字
        if let Ok(listener) = state.listener.lock() {
            let new_text = if listener.is_running() {
                "暂停记录"
            } else {
                "开始记录"
            };
            drop(listener);

            let tray = app.tray_handle().get_item("toggle_record");
            let _ = tray.set_title(new_text);
        }
    }
}
