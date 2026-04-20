use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

/// 应用数据库管理器
pub struct Database {
    pub conn: Mutex<Connection>,
}

/// 键盘事件记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyEvent {
    pub id: i64,
    pub key_name: String,
    pub key_code: Option<i32>,
    pub timestamp: String,
    pub session_id: String,
}

/// 鼠标事件记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MouseEvent {
    pub id: i64,
    pub event_type: String,
    pub x: i32,
    pub y: i32,
    pub timestamp: String,
    pub session_id: String,
}

/// 会话记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub total_keys: i64,
    pub total_clicks: i64,
    pub total_distance: f64,
}

/// 按键统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyCount {
    pub key_name: String,
    pub count: i64,
}

/// 组合快捷键统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComboKeyCount {
    pub combo_name: String,  // 如 "Ctrl+C", "Ctrl+V", "Alt+Tab"
    pub count: i64,
}

/// 每日统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: String,
    pub total_keys: i64,
    pub total_clicks: i64,
    pub total_distance: f64,
    pub active_minutes: i64,
}

/// 小时分布
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HourlyDistribution {
    pub hour: i32,
    pub count: i64,
}

/// 总体统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverallStats {
    pub total_keys: i64,
    pub total_clicks: i64,
    pub total_distance: f64,
    pub total_sessions: i64,
    pub active_minutes: i64,
    pub most_active_hour: i32,
}

/// 应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub is_recording: bool,
    pub auto_start: bool,
    pub show_tray_icon: bool,
    pub theme: String,
    pub language: String,
    pub ignore_mouse_move: bool,
    pub mouse_move_threshold: i32,
    // 前端需要的额外字段
    pub color_scheme: String,
    pub keyboard_layout: String,
    pub minimize_to_tray: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_recording: true,
            auto_start: false,
            show_tray_icon: true,
            theme: "dark".to_string(),
            language: "zh-CN".to_string(),
            ignore_mouse_move: false,
            mouse_move_threshold: 5,
            color_scheme: "neon".to_string(),
            keyboard_layout: "60%".to_string(),
            minimize_to_tray: true,
        }
    }
}

impl Database {
    /// 初始化数据库，创建所有必要的表
    pub fn new(db_path: PathBuf) -> Result<Self, String> {
        // 确保父目录存在
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let conn = Connection::open(&db_path).map_err(|e| format!("无法打开数据库: {}", e))?;

        // 启用 WAL 模式以提升并发性能
        conn.execute_batch("PRAGMA journal_mode=WAL;")
            .map_err(|e| format!("设置 WAL 模式失败: {}", e))?;

        let db = Self {
            conn: Mutex::new(conn),
        };
        db.create_tables()?;
        db.init_settings()?;

        Ok(db)
    }

    /// 创建数据库表
    fn create_tables(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS key_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_name TEXT NOT NULL,
                key_code INTEGER,
                timestamp TEXT NOT NULL,
                session_id TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_key_events_timestamp ON key_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_key_events_session ON key_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_key_events_key_name ON key_events(key_name);

            CREATE TABLE IF NOT EXISTS mouse_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL CHECK(event_type IN ('click', 'move', 'scroll')),
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                session_id TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_mouse_events_timestamp ON mouse_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_mouse_events_session ON mouse_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_mouse_events_type ON mouse_events(event_type);

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                start_time TEXT NOT NULL,
                end_time TEXT,
                total_keys INTEGER DEFAULT 0,
                total_clicks INTEGER DEFAULT 0,
                total_distance REAL DEFAULT 0.0
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS mouse_positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                session_id TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_mouse_positions_timestamp ON mouse_positions(timestamp);

            CREATE TABLE IF NOT EXISTS combo_key_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                combo_name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                session_id TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_combo_key_events_timestamp ON combo_key_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_combo_key_events_combo ON combo_key_events(combo_name);
            ",
        )
        .map_err(|e| format!("创建表失败: {}", e))?;

        Ok(())
    }

    /// 初始化默认设置
    fn init_settings(&self) -> Result<(), String> {
        let defaults = AppSettings::default();
        let json = serde_json::to_string(&defaults).map_err(|e| e.to_string())?;

        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('settings', ?1)",
            params![json],
        )
        .map_err(|e| format!("初始化设置失败: {}", e))?;

        Ok(())
    }

    // ==================== 键盘事件操作 ====================

    /// 插入键盘事件
    pub fn insert_key_event(
        &self,
        key_name: &str,
        key_code: Option<i32>,
        timestamp: &str,
        session_id: &str,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO key_events (key_name, key_code, timestamp, session_id) VALUES (?1, ?2, ?3, ?4)",
            params![key_name, key_code, timestamp, session_id],
        )
        .map_err(|e| format!("插入键盘事件失败: {}", e))?;

        // 更新会话的总按键数
        conn.execute(
            "UPDATE sessions SET total_keys = total_keys + 1 WHERE id = ?1",
            params![session_id],
        )
        .map_err(|e| format!("更新会话按键数失败: {}", e))?;

        Ok(())
    }

    // ==================== 鼠标事件操作 ====================

    /// 插入鼠标事件
    pub fn insert_mouse_event(
        &self,
        event_type: &str,
        x: i32,
        y: i32,
        timestamp: &str,
        session_id: &str,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO mouse_events (event_type, x, y, timestamp, session_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![event_type, x, y, timestamp, session_id],
        )
        .map_err(|e| format!("插入鼠标事件失败: {}", e))?;

        // 如果是点击事件，更新会话的总点击数
        if event_type == "click" {
            conn.execute(
                "UPDATE sessions SET total_clicks = total_clicks + 1 WHERE id = ?1",
                params![session_id],
            )
            .map_err(|e| format!("更新会话点击数失败: {}", e))?;
        }

        Ok(())
    }

    /// 插入鼠标位置（用于热力图）
    pub fn insert_mouse_position(
        &self,
        x: i32,
        y: i32,
        timestamp: &str,
        session_id: &str,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO mouse_positions (x, y, timestamp, session_id) VALUES (?1, ?2, ?3, ?4)",
            params![x, y, timestamp, session_id],
        )
        .map_err(|e| format!("插入鼠标位置失败: {}", e))?;

        Ok(())
    }

    /// 更新会话的鼠标移动距离
    pub fn update_session_distance(&self, session_id: &str, distance: f64) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE sessions SET total_distance = total_distance + ?1 WHERE id = ?2",
            params![distance, session_id],
        )
        .map_err(|e| format!("更新会话移动距离失败: {}", e))?;

        Ok(())
    }

    // ==================== 会话操作 ====================

    /// 创建新会话
    pub fn create_session(&self, session_id: &str, start_time: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO sessions (id, start_time, total_keys, total_clicks, total_distance) VALUES (?1, ?2, 0, 0, 0.0)",
            params![session_id, start_time],
        )
        .map_err(|e| format!("创建会话失败: {}", e))?;

        Ok(())
    }

    /// 结束当前会话
    pub fn end_session(&self, session_id: &str, end_time: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE sessions SET end_time = ?1 WHERE id = ?2",
            params![end_time, session_id],
        )
        .map_err(|e| format!("结束会话失败: {}", e))?;

        Ok(())
    }

    /// 获取当前活跃会话
    pub fn get_active_session(&self) -> Result<Option<Session>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, start_time, end_time, total_keys, total_clicks, total_distance FROM sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1",
            )
            .map_err(|e| format!("查询活跃会话失败: {}", e))?;

        let session = stmt
            .query_row([], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    start_time: row.get(1)?,
                    end_time: row.get(2)?,
                    total_keys: row.get(3)?,
                    total_clicks: row.get(4)?,
                    total_distance: row.get(5)?,
                })
            })
            .ok();

        Ok(session)
    }

    /// 获取所有会话历史
    pub fn get_session_history(&self) -> Result<Vec<Session>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, start_time, end_time, total_keys, total_clicks, total_distance FROM sessions ORDER BY start_time DESC",
            )
            .map_err(|e| format!("查询会话历史失败: {}", e))?;

        let sessions = stmt
            .query_map([], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    start_time: row.get(1)?,
                    end_time: row.get(2)?,
                    total_keys: row.get(3)?,
                    total_clicks: row.get(4)?,
                    total_distance: row.get(5)?,
                })
            })
            .map_err(|e| format!("映射会话数据失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集会话数据失败: {}", e))?;

        Ok(sessions)
    }

    // ==================== 统计查询 ====================

    /// 获取指定时间段的按键热力数据
    pub fn get_heatmap_data(&self, period: &str) -> Result<Vec<KeyCount>, String> {
        let time_filter = match period {
            "today" => "date(timestamp) = date('now', 'localtime')",
            "week" => "date(timestamp) >= date('now', '-7 days', 'localtime')",
            "month" => "date(timestamp) >= date('now', '-30 days', 'localtime')",
            "year" => "date(timestamp) >= date('now', '-365 days', 'localtime')",
            _ => "1=1", // all
        };

        let query = format!(
            "SELECT key_name, COUNT(*) as count FROM key_events WHERE {} GROUP BY key_name ORDER BY count DESC",
            time_filter
        );

        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(&query).map_err(|e| format!("查询热力数据失败: {}", e))?;

        let data = stmt
            .query_map([], |row| {
                Ok(KeyCount {
                    key_name: row.get(0)?,
                    count: row.get(1)?,
                })
            })
            .map_err(|e| format!("映射热力数据失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集热力数据失败: {}", e))?;

        Ok(data)
    }

    /// 获取总体统计
    pub fn get_stats(&self) -> Result<OverallStats, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let total_keys: i64 = conn
            .query_row("SELECT COUNT(*) FROM key_events", [], |row| row.get(0))
            .unwrap_or(0);

        let total_clicks: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM mouse_events WHERE event_type = 'click'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let total_distance: f64 = conn
            .query_row("SELECT COALESCE(SUM(total_distance), 0.0) FROM sessions", [], |row| {
                row.get(0)
            })
            .unwrap_or(0.0);

        let total_sessions: i64 = conn
            .query_row("SELECT COUNT(*) FROM sessions", [], |row| row.get(0))
            .unwrap_or(0);

        // 计算活跃分钟数（基于有事件的唯一分钟数）
        let active_minutes: i64 = conn
            .query_row(
                "SELECT COUNT(DISTINCT strftime('%Y-%m-%d %H:%M', timestamp)) FROM key_events",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // 获取最活跃的小时
        let most_active_hour: i32 = conn
            .query_row(
                "SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as cnt \
                 FROM key_events \
                 GROUP BY hour \
                 ORDER BY cnt DESC \
                 LIMIT 1",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok(OverallStats {
            total_keys,
            total_clicks,
            total_distance,
            total_sessions,
            active_minutes,
            most_active_hour,
        })
    }

    /// 获取每日统计趋势
    pub fn get_daily_stats(&self, days: i32) -> Result<Vec<DailyStats>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "WITH key_daily AS (
                    SELECT date(timestamp) as d, COUNT(*) as kc
                    FROM key_events
                    WHERE date(timestamp) >= date('now', 'localtime', '-' || ?1 || ' days')
                    GROUP BY d
                ),
                click_daily AS (
                    SELECT date(timestamp) as d, COUNT(*) as cc
                    FROM mouse_events
                    WHERE event_type = 'click'
                      AND date(timestamp) >= date('now', 'localtime', '-' || ?1 || ' days')
                    GROUP BY d
                ),
                dist_daily AS (
                    SELECT date(start_time) as d, COALESCE(SUM(total_distance), 0.0) as td
                    FROM sessions
                    WHERE date(start_time) >= date('now', 'localtime', '-' || ?1 || ' days')
                    GROUP BY d
                ),
                active_daily AS (
                    SELECT date(timestamp) as d, COUNT(DISTINCT strftime('%Y-%m-%d %H:%M', timestamp)) as am
                    FROM key_events
                    WHERE date(timestamp) >= date('now', 'localtime', '-' || ?1 || ' days')
                    GROUP BY d
                )
                SELECT
                    dates.d as date,
                    COALESCE(kd.kc, 0) as total_keys,
                    COALESCE(cd.cc, 0) as total_clicks,
                    COALESCE(dd.td, 0.0) as total_distance,
                    COALESCE(ad.am, 0) as active_minutes
                FROM (
                    SELECT DISTINCT date('now', 'localtime', '-' || n || ' days') as d
                    FROM (
                        WITH RECURSIVE cnt(x) AS (
                            SELECT 0 UNION ALL SELECT x+1 FROM cnt WHERE x < ?1
                        ) SELECT x as n FROM cnt
                    )
                ) dates
                LEFT JOIN key_daily kd ON dates.d = kd.d
                LEFT JOIN click_daily cd ON dates.d = cd.d
                LEFT JOIN dist_daily dd ON dates.d = dd.d
                LEFT JOIN active_daily ad ON dates.d = ad.d
                ORDER BY dates.d ASC",
            )
            .map_err(|e| format!("查询每日统计失败: {}", e))?;

        let stats = stmt
            .query_map(params![days], |row| {
                Ok(DailyStats {
                    date: row.get(0)?,
                    total_keys: row.get(1)?,
                    total_clicks: row.get(2)?,
                    total_distance: row.get(3)?,
                    active_minutes: row.get(4)?,
                })
            })
            .map_err(|e| format!("映射每日统计失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集每日统计失败: {}", e))?;

        Ok(stats)
    }

    /// 获取最常用的按键排行
    pub fn get_top_keys(&self, limit: i32) -> Result<Vec<KeyCount>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT key_name, COUNT(*) as count FROM key_events GROUP BY key_name ORDER BY count DESC LIMIT ?1",
            )
            .map_err(|e| format!("查询按键排行失败: {}", e))?;

        let keys = stmt
            .query_map(params![limit], |row| {
                Ok(KeyCount {
                    key_name: row.get(0)?,
                    count: row.get(1)?,
                })
            })
            .map_err(|e| format!("映射按键排行失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集按键排行失败: {}", e))?;

        Ok(keys)
    }

    /// 获取鼠标热力数据（网格化坐标）
    pub fn get_mouse_heatmap_data(&self) -> Result<Vec<(i32, i32, i64)>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        // 将鼠标位置按网格聚合（每50像素一个格子）
        let mut stmt = conn
            .prepare(
                "SELECT (x / 50) * 50 as gx, (y / 50) * 50 as gy, COUNT(*) as cnt \
                 FROM mouse_positions \
                 GROUP BY gx, gy \
                 ORDER BY cnt DESC",
            )
            .map_err(|e| format!("查询鼠标热力数据失败: {}", e))?;

        let data = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?, row.get::<_, i64>(2)?))
            })
            .map_err(|e| format!("映射鼠标热力数据失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集鼠标热力数据失败: {}", e))?;

        Ok(data)
    }

    /// 获取最近1小时的鼠标移动轨迹数据
    pub fn get_mouse_trajectory(&self) -> Result<Vec<(i32, i32, String)>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "SELECT x, y, timestamp FROM mouse_positions \
                 WHERE timestamp >= datetime('now', 'localtime', '-1 hour') \
                 ORDER BY timestamp ASC",
            )
            .map_err(|e| format!("查询鼠标轨迹数据失败: {}", e))?;

        let data = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?, row.get::<_, String>(2)?))
            })
            .map_err(|e| format!("映射鼠标轨迹数据失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集鼠标轨迹数据失败: {}", e))?;

        Ok(data)
    }

    /// 获取24小时按键分布
    pub fn get_hourly_distribution(&self) -> Result<Vec<HourlyDistribution>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "WITH all_hours AS (
                    SELECT 0 as hour UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
                    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
                    UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
                    UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
                    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
                    UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
                ),
                key_counts AS (
                    SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
                    FROM key_events
                    WHERE date(timestamp) = date('now', 'localtime')
                    GROUP BY hour
                ),
                click_counts AS (
                    SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
                    FROM mouse_events
                    WHERE event_type = 'click'
                      AND date(timestamp) = date('now', 'localtime')
                    GROUP BY hour
                ),
                combined AS (
                    SELECT hour, SUM(count) as count FROM (
                        SELECT hour, count FROM key_counts
                        UNION ALL
                        SELECT hour, count FROM click_counts
                    )
                    GROUP BY hour
                )
                SELECT h.hour, COALESCE(c.count, 0) as count
                FROM all_hours h
                LEFT JOIN combined c ON h.hour = c.hour
                ORDER BY h.hour ASC",
            )
            .map_err(|e| format!("查询小时分布失败: {}", e))?;

        let data = stmt
            .query_map([], |row| {
                Ok(HourlyDistribution {
                    hour: row.get(0)?,
                    count: row.get(1)?,
                })
            })
            .map_err(|e| format!("映射小时分布失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("收集小时分布失败: {}", e))?;

        Ok(data)
    }

    // ==================== 设置操作 ====================

    /// 获取应用设置
    pub fn get_settings(&self) -> Result<AppSettings, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let value: String = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'settings'",
                [],
                |row| row.get(0),
            )
            .map_err(|e| format!("查询设置失败: {}", e))?;

        serde_json::from_str(&value).map_err(|e| format!("解析设置失败: {}", e))
    }

    /// 保存应用设置
    pub fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let json = serde_json::to_string(settings).map_err(|e| format!("序列化设置失败: {}", e))?;
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE app_settings SET value = ?1 WHERE key = 'settings'",
            params![json],
        )
        .map_err(|e| format!("保存设置失败: {}", e))?;

        Ok(())
    }

    // ==================== 组合键事件操作 ====================

    /// 插入组合键事件
    pub fn insert_combo_event(&self, combo_name: &str, timestamp: &str, session_id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO combo_key_events (combo_name, timestamp, session_id) VALUES (?1, ?2, ?3)",
            params![combo_name, timestamp, session_id],
        ).map_err(|e| format!("插入组合键事件失败: {}", e))?;
        Ok(())
    }

    /// 获取组合快捷键排行
    pub fn get_top_combos(&self, limit: i32) -> Result<Vec<ComboKeyCount>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT combo_name, COUNT(*) as count FROM combo_key_events GROUP BY combo_name ORDER BY count DESC LIMIT ?1"
        ).map_err(|e| format!("查询组合键排行失败: {}", e))?;

        let data = stmt.query_map(params![limit], |row| {
            Ok(ComboKeyCount {
                combo_name: row.get(0)?,
                count: row.get(1)?,
            })
        }).map_err(|e| format!("映射组合键数据失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("收集组合键数据失败: {}", e))?;

        Ok(data)
    }

    /// 获取指定时间段的组合键统计
    pub fn get_combo_stats(&self, period: &str) -> Result<Vec<ComboKeyCount>, String> {
        let time_filter = match period {
            "today" => "date(timestamp) = date('now', 'localtime')",
            "week" => "date(timestamp) >= date('now', '-7 days', 'localtime')",
            "month" => "date(timestamp) >= date('now', '-30 days', 'localtime')",
            _ => "1=1",
        };

        let query = format!(
            "SELECT combo_name, COUNT(*) as count FROM combo_key_events WHERE {} GROUP BY combo_name ORDER BY count DESC",
            time_filter
        );

        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(&query).map_err(|e| format!("查询组合键统计失败: {}", e))?;

        let data = stmt.query_map([], |row| {
            Ok(ComboKeyCount {
                combo_name: row.get(0)?,
                count: row.get(1)?,
            })
        }).map_err(|e| format!("映射组合键数据失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("收集组合键数据失败: {}", e))?;

        Ok(data)
    }

    // ==================== 数据管理 ====================

    /// 清除所有数据
    pub fn clear_all_data(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute_batch(
            "DELETE FROM key_events;
             DELETE FROM mouse_events;
             DELETE FROM mouse_positions;
             DELETE FROM sessions;
             DELETE FROM combo_key_events;"
        )
        .map_err(|e| format!("清除数据失败: {}", e))?;

        // 重建数据库文件以回收空间
        conn.execute_batch("VACUUM;")
            .map_err(|e| format!("压缩数据库失败: {}", e))?;

        Ok(())
    }

    /// 导出所有数据为 JSON 格式
    pub fn export_data_json(&self) -> Result<String, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut key_events: Vec<KeyEvent> = Vec::new();
        let mut mouse_events: Vec<MouseEvent> = Vec::new();
        let mut sessions: Vec<Session> = Vec::new();
        let mut combo_key_events: Vec<ComboKeyCount> = Vec::new();

        // 查询键盘事件
        {
            let mut stmt = conn
                .prepare("SELECT id, key_name, key_code, timestamp, session_id FROM key_events ORDER BY timestamp")
                .map_err(|e| format!("查询键盘事件失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(KeyEvent {
                        id: row.get(0)?,
                        key_name: row.get(1)?,
                        key_code: row.get(2)?,
                        timestamp: row.get(3)?,
                        session_id: row.get(4)?,
                    })
                })
                .map_err(|e| format!("映射键盘事件失败: {}", e))?;

            for row in rows {
                key_events.push(row.map_err(|e| format!("读取键盘事件失败: {}", e))?);
            }
        }

        // 查询鼠标事件
        {
            let mut stmt = conn
                .prepare("SELECT id, event_type, x, y, timestamp, session_id FROM mouse_events ORDER BY timestamp")
                .map_err(|e| format!("查询鼠标事件失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(MouseEvent {
                        id: row.get(0)?,
                        event_type: row.get(1)?,
                        x: row.get(2)?,
                        y: row.get(3)?,
                        timestamp: row.get(4)?,
                        session_id: row.get(5)?,
                    })
                })
                .map_err(|e| format!("映射鼠标事件失败: {}", e))?;

            for row in rows {
                mouse_events.push(row.map_err(|e| format!("读取鼠标事件失败: {}", e))?);
            }
        }

        // 查询会话
        {
            let mut stmt = conn
                .prepare("SELECT id, start_time, end_time, total_keys, total_clicks, total_distance FROM sessions ORDER BY start_time")
                .map_err(|e| format!("查询会话失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(Session {
                        id: row.get(0)?,
                        start_time: row.get(1)?,
                        end_time: row.get(2)?,
                        total_keys: row.get(3)?,
                        total_clicks: row.get(4)?,
                        total_distance: row.get(5)?,
                    })
                })
                .map_err(|e| format!("映射会话失败: {}", e))?;

            for row in rows {
                sessions.push(row.map_err(|e| format!("读取会话失败: {}", e))?);
            }
        }

        // 查询组合键事件
        {
            let mut stmt = conn
                .prepare("SELECT combo_name, COUNT(*) as count FROM combo_key_events GROUP BY combo_name ORDER BY count DESC")
                .map_err(|e| format!("查询组合键事件失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(ComboKeyCount {
                        combo_name: row.get(0)?,
                        count: row.get(1)?,
                    })
                })
                .map_err(|e| format!("映射组合键事件失败: {}", e))?;

            for row in rows {
                combo_key_events.push(row.map_err(|e| format!("读取组合键事件失败: {}", e))?);
            }
        }

        let export = serde_json::json!({
            "export_time": chrono::Local::now().to_rfc3339(),
            "key_events": key_events,
            "mouse_events": mouse_events,
            "sessions": sessions,
            "combo_key_events": combo_key_events,
        });

        serde_json::to_string_pretty(&export).map_err(|e| format!("序列化导出数据失败: {}", e))
    }

    /// 导出所有数据为 CSV 格式
    pub fn export_data_csv(&self) -> Result<String, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut csv = String::new();

        // 键盘事件 CSV
        csv.push_str("=== Key Events ===\n");
        csv.push_str("id,key_name,key_code,timestamp,session_id\n");
        {
            let mut stmt = conn
                .prepare("SELECT id, key_name, key_code, timestamp, session_id FROM key_events ORDER BY timestamp")
                .map_err(|e| format!("查询键盘事件失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, Option<i32>>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                    ))
                })
                .map_err(|e| format!("映射键盘事件失败: {}", e))?;

            for row in rows {
                let (id, key_name, key_code, timestamp, session_id) =
                    row.map_err(|e| format!("读取键盘事件失败: {}", e))?;
                csv.push_str(&format!(
                    "{},\"{}\",{},\"{}\",\"{}\"\n",
                    id,
                    key_name.replace('"', "\"\""),
                    key_code.map(|k| k.to_string()).unwrap_or_default(),
                    timestamp,
                    session_id
                ));
            }
        }

        // 鼠标事件 CSV
        csv.push_str("\n=== Mouse Events ===\n");
        csv.push_str("id,event_type,x,y,timestamp,session_id\n");
        {
            let mut stmt = conn
                .prepare("SELECT id, event_type, x, y, timestamp, session_id FROM mouse_events ORDER BY timestamp")
                .map_err(|e| format!("查询鼠标事件失败: {}", e))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, i32>(2)?,
                        row.get::<_, i32>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                    ))
                })
                .map_err(|e| format!("映射鼠标事件失败: {}", e))?;

            for row in rows {
                let (id, event_type, x, y, timestamp, session_id) =
                    row.map_err(|e| format!("读取鼠标事件失败: {}", e))?;
                csv.push_str(&format!(
                    "{},{},{},{},\"{}\",\"{}\"\n",
                    id, event_type, x, y, timestamp, session_id
                ));
            }
        }

        Ok(csv)
    }
}
