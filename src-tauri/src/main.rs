mod adapter;
mod application;
mod profiles;
use tokio::sync::Mutex;

#[tauri::command]
async fn diagnose(lock: tauri::State<'_, Mutex<()>>) -> Result<adapter::Capabilities, String> {
    let _guard = lock.lock().await;
    Ok(adapter::diagnose().await)
}
#[tauri::command]
async fn get_state(
    lock: tauri::State<'_, Mutex<()>>,
) -> Result<application::LightingState, String> {
    let _guard = lock.lock().await;
    Ok(application::LightingState {
        brightness: adapter::brightness().await,
        ..Default::default()
    })
}
#[tauri::command]
async fn apply_lighting(
    color: String,
    brightness: String,
    lock: tauri::State<'_, Mutex<()>>,
) -> Result<application::ApplyResult, String> {
    let _guard = lock.lock().await;
    application::apply(&color, &brightness).await
}
#[tauri::command]
async fn load_profiles(lock: tauri::State<'_, Mutex<()>>) -> Result<profiles::ProfileFile, String> {
    let _guard = lock.lock().await;
    tauri::async_runtime::spawn_blocking(|| profiles::load(&profiles::config_path()?))
        .await
        .map_err(|e| e.to_string())?
}
#[tauri::command]
async fn save_profiles(
    file: profiles::ProfileFile,
    lock: tauri::State<'_, Mutex<()>>,
) -> Result<(), String> {
    let _guard = lock.lock().await;
    tauri::async_runtime::spawn_blocking(move || profiles::save(&profiles::config_path()?, &file))
        .await
        .map_err(|e| e.to_string())?
}
#[tauri::command]
fn fit_window(window: tauri::Window, height: f64) -> Result<(), String> {
    if !height.is_finite() || !(100.0..=4000.0).contains(&height) {
        return Err("Altura inválida.".into());
    }
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let max = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .map(|m| m.size().height as f64 / m.scale_factor() - 64.0)
        .unwrap_or(760.0)
        .max(320.0);
    let desired = height.clamp(320.0, max);
    if (size.height as f64 / scale - desired).abs() > 1.0 {
        window
            .set_size(tauri::LogicalSize::new(size.width as f64 / scale, desired))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[tauri::command]
fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}
fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(()))
        .invoke_handler(tauri::generate_handler![
            diagnose,
            get_state,
            apply_lighting,
            load_profiles,
            save_profiles,
            close_window,
            fit_window
        ])
        .run(tauri::generate_context!())
        .expect("Falha ao iniciar TUF Pulse");
}
