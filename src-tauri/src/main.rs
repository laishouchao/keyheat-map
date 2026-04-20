#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;
mod input_listener;
mod tray;

use std::sync::Arc;

use commands::AppState;
use db::Database;
use input_listener::InputListener;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        // 注册系统托盘
        .system_tray(tray::create_system_tray())
        .on_system_tray_event(tray::handle_tray_event)
        // 注册所有 Tauri 命令
        .invoke_handler(tauri::generate_handler![
            commands::get_heatmap_data,
            commands::get_stats,
            commands::get_daily_stats,
            commands::get_top_keys,
            commands::get_mouse_heatmap_data,
            commands::get_mouse_trajectory,
            commands::get_hourly_distribution,
            commands::get_session_history,
            commands::clear_all_data,
            commands::export_data,
            commands::get_app_settings,
            commands::save_app_settings,
            commands::toggle_recording,
            commands::get_recording_status,
            commands::get_top_combos,
            commands::get_combo_stats,
        ])
        // 应用启动后初始化
        .setup(move |app| {
            // 获取应用数据目录
            let app_data_dir = app.path_resolver().app_data_dir().expect("无法获取应用数据目录");

            // 数据库文件路径
            let db_path = app_data_dir.join("keyheat-map.db");

            // 初始化数据库
            let database = Database::new(db_path).expect("无法初始化数据库");
            let db = Arc::new(database);

            // 创建输入监听器
            let listener = InputListener::new();

            // 创建应用状态并注册
            let app_state = AppState {
                db: Arc::clone(&db),
                listener: std::sync::Mutex::new(listener),
            };
            app.manage(app_state);

            // 读取设置以决定是否自动开始录制
            let auto_start_recording = db
                .get_settings()
                .map(|s| s.is_recording)
                .unwrap_or(true);

            // 配置主窗口
            let main_window = app.get_window("main").expect("主窗口不存在");

            // 设置窗口标题
            main_window
                .set_title("键盘侠 - KeyHeat Map")
                .expect("设置窗口标题失败");

            // 设置窗口大小
            main_window
                .set_size(tauri::Size::Physical(tauri::PhysicalSize::new(1100, 750)))
                .expect("设置窗口大小失败");

            // 设置最小窗口尺寸
            main_window
                .set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize::new(960, 640))))
                .expect("设置最小窗口尺寸失败");

            // 窗口居中显示
            main_window
                .center()
                .expect("窗口居中失败");

            // macOS 使用系统原生标题栏（自带红绿灯按钮）
            // Windows/Linux 也使用系统原生标题栏（自带最小化/最大化/关闭按钮）
            // 不再隐藏装饰，使用原生窗口控制

            // 如果设置了自动开始录制，则启动输入监听
            if auto_start_recording {
                let state = app.state::<AppState>();
                let mut listener = state.listener.lock().expect("获取监听器锁失败");
                if let Err(e) = listener.start(Arc::clone(&state.db), app.handle().clone()) {
                    eprintln!("启动输入监听失败: {}", e);
                }
            }

            // 关闭窗口时隐藏而不是退出
            let window_clone = main_window.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // 阻止默认关闭行为，改为隐藏窗口
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
