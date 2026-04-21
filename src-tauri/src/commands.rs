use std::sync::Mutex;

use crate::db::{AppSettings, ComboKeyCount, Database, DailyStats, HourlyDistribution, KeyCount, OverallStats, Session};
use crate::input_listener::InputListener;

/// 应用共享状态
pub struct AppState {
    pub db: std::sync::Arc<Database>,
    pub listener: Mutex<InputListener>,
}

/// 获取指定时间段的按键热力数据
#[tauri::command]
pub fn get_heatmap_data(
    state: tauri::State<AppState>,
    period: String,
) -> Result<Vec<KeyCount>, String> {
    state.db.get_heatmap_data(&period)
}

/// 获取总体统计
#[tauri::command]
pub fn get_stats(state: tauri::State<AppState>) -> Result<OverallStats, String> {
    state.db.get_stats()
}

/// 获取今日统计（从0时开始）
#[tauri::command]
pub fn get_today_stats(state: tauri::State<AppState>) -> Result<OverallStats, String> {
    state.db.get_today_stats()
}

/// 获取每日统计趋势
#[tauri::command]
pub fn get_daily_stats(
    state: tauri::State<AppState>,
    days: i32,
) -> Result<Vec<DailyStats>, String> {
    let days = days.clamp(0, 365);
    state.db.get_daily_stats(days)
}

/// 获取最常用的按键排行
#[tauri::command]
pub fn get_top_keys(state: tauri::State<AppState>, limit: i32) -> Result<Vec<KeyCount>, String> {
    let limit = limit.clamp(1, 100);
    state.db.get_top_keys(limit)
}

/// 获取鼠标热力数据
#[tauri::command]
pub fn get_mouse_heatmap_data(
    state: tauri::State<AppState>,
) -> Result<Vec<(i32, i32, i64)>, String> {
    state.db.get_mouse_heatmap_data()
}

/// 获取鼠标移动轨迹数据（最近1小时）
#[tauri::command]
pub fn get_mouse_trajectory(
    state: tauri::State<AppState>,
) -> Result<Vec<(i32, i32, String)>, String> {
    state.db.get_mouse_trajectory()
}

/// 获取24小时按键分布
#[tauri::command]
pub fn get_hourly_distribution(
    state: tauri::State<AppState>,
) -> Result<Vec<HourlyDistribution>, String> {
    state.db.get_hourly_distribution()
}

/// 获取历史会话列表
#[tauri::command]
pub fn get_session_history(state: tauri::State<AppState>) -> Result<Vec<Session>, String> {
    state.db.get_session_history()
}

/// 清除所有数据
#[tauri::command]
pub fn clear_all_data(state: tauri::State<AppState>) -> Result<(), String> {
    state.db.clear_all_data()
}

/// 导出数据
#[tauri::command]
pub fn export_data(
    state: tauri::State<AppState>,
    _app_handle: tauri::AppHandle,
    format: String,
) -> Result<String, String> {
    let content = match format.as_str() {
        "json" => state.db.export_data_json()?,
        "csv" => state.db.export_data_csv()?,
        _ => return Err(format!("不支持的导出格式: {}", format)),
    };

    // 使用 Tauri 对话框选择保存路径
    let extension = match format.as_str() {
        "json" => "json",
        "csv" => "csv",
        _ => "txt",
    };

    let file_name = format!("keyheat-export.{}", extension);

    // 使用 tauri::api::dialog::FileDialogBuilder 保存文件
    use tauri::api::dialog::FileDialogBuilder;

    let (tx, rx) = std::sync::mpsc::channel();

    FileDialogBuilder::new()
        .set_file_name(&file_name)
        .add_filter(
            &format!("{} files", extension.to_uppercase()),
            &[extension],
        )
        .save_file(move |file_path| {
            if let Some(path) = file_path {
                let _ = tx.send(path);
            } else {
                let _ = tx.send(std::path::PathBuf::new());
            }
        });

    // 等待用户选择文件路径
    let path = rx
        .recv_timeout(std::time::Duration::from_secs(60))
        .map_err(|_| "等待文件选择超时".to_string())?;

    if path.as_os_str().is_empty() {
        return Err("用户取消了导出".to_string());
    }

    std::fs::write(&path, &content).map_err(|e| format!("写入文件失败: {}", e))?;

    Ok(format!("数据已成功导出到: {}", path.display()))
}

/// 获取应用设置
#[tauri::command]
pub fn get_app_settings(state: tauri::State<AppState>) -> Result<AppSettings, String> {
    state.db.get_settings()
}

/// 保存应用设置
#[tauri::command]
pub fn save_app_settings(
    state: tauri::State<AppState>,
    settings: AppSettings,
) -> Result<(), String> {
    state.db.save_settings(&settings)
}

/// 切换录制状态
#[tauri::command]
pub fn toggle_recording(app_handle: tauri::AppHandle, state: tauri::State<AppState>) -> Result<bool, String> {
    let mut listener = state.listener.lock().map_err(|e| e.to_string())?;

    if listener.is_running() {
        listener.stop(&state.db)?;
        Ok(false)
    } else {
        listener.start(std::sync::Arc::clone(&state.db), app_handle)?;
        Ok(true)
    }
}

/// 获取当前录制状态
#[tauri::command]
pub fn get_recording_status(state: tauri::State<AppState>) -> Result<bool, String> {
    let listener = state.listener.lock().map_err(|e| e.to_string())?;
    Ok(listener.is_running())
}

/// 获取组合快捷键排行
#[tauri::command]
pub fn get_top_combos(state: tauri::State<AppState>, limit: i32) -> Result<Vec<ComboKeyCount>, String> {
    let limit = limit.clamp(1, 100);
    state.db.get_top_combos(limit)
}

/// 获取指定时间段的组合键统计
#[tauri::command]
pub fn get_combo_stats(
    state: tauri::State<AppState>,
    period: String,
) -> Result<Vec<ComboKeyCount>, String> {
    state.db.get_combo_stats(&period)
}
