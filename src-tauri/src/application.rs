use crate::adapter;
use serde::Serialize;
#[derive(Default, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LightingState {
    pub color: Option<String>,
    pub brightness: Option<String>,
    pub effect: Option<String>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub status: String,
    pub confirmed_state: LightingState,
    pub message: String,
}

pub async fn apply(color: &str, level: &str) -> Result<ApplyResult, String> {
    adapter::validate_color(color)?;
    adapter::validate_brightness(level)?;
    let caps = adapter::diagnose().await;
    if caps.connection != "ready" {
        return Err(caps.message);
    }
    if !caps.effects.contains_key("static") || !caps.brightness.iter().any(|b| b == level) {
        return Err("Cor fixa ou nível de brilho não anunciado pelo dispositivo.".into());
    }
    let mut state = LightingState::default();
    if let Err(error) = adapter::run(&["aura", "effect", "static", "-c", color]).await {
        state.brightness = adapter::brightness().await;
        return Ok(ApplyResult {
            status: "failed".into(),
            confirmed_state: state,
            message: error,
        });
    }
    state.color = Some(color.to_lowercase());
    state.effect = Some("static".into());
    let result = adapter::run(&["leds", "set", level]).await;
    state.brightness = adapter::brightness().await;
    Ok(finish_brightness(state, level, result))
}

fn finish_brightness(
    state: LightingState,
    level: &str,
    result: Result<String, String>,
) -> ApplyResult {
    match result {
        Ok(_) if state.brightness.as_deref() == Some(level) => ApplyResult { status: "applied".into(), confirmed_state: state, message: "Cor aceita pelo asusctl; brilho confirmado por leitura. Confira visualmente os LEDs.".into() },
        other => ApplyResult { status: "partial".into(), confirmed_state: state, message: format!("Cor aceita, mas o brilho não foi confirmado. {}", other.err().unwrap_or_else(|| "A leitura divergiu ou ficou indisponível.".into())) },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn partial_failure_and_readback_mismatch() {
        for result in [Err("daemon disconnected".into()), Ok(String::new())] {
            let state = LightingState {
                color: Some("abcdef".into()),
                brightness: Some("low".into()),
                effect: Some("static".into()),
            };
            let r = finish_brightness(state, "high", result);
            assert_eq!(r.status, "partial");
            assert_eq!(r.confirmed_state.color.as_deref(), Some("abcdef"));
            assert_eq!(r.confirmed_state.brightness.as_deref(), Some("low"));
        }
        let state = LightingState {
            brightness: Some("high".into()),
            ..Default::default()
        };
        assert_eq!(
            finish_brightness(state, "high", Ok(String::new())).status,
            "applied"
        );
    }
    #[test]
    #[ignore = "Changes real keyboard; run only after announcing and checking restoration values"]
    fn hardware_smoke() {
        tauri::async_runtime::block_on(async {
            let restore_color = std::env::var("TUF_PULSE_RESTORE_COLOR")
                .expect("Set restoration color after inspecting current state");
            let restore_brightness = std::env::var("TUF_PULSE_RESTORE_BRIGHTNESS")
                .expect("Set restoration brightness after reading current state");
            adapter::validate_color(&restore_color).unwrap();
            adapter::validate_brightness(&restore_brightness).unwrap();
            let mut failures = Vec::new();
            for level in ["off", "low", "med", "high"] {
                match apply("4de8d1", level).await {
                    Ok(r) if r.status == "applied" => println!("Cyber / {level}: {}", r.message),
                    Ok(r) => failures.push(format!("{level}: {}", r.message)),
                    Err(e) => failures.push(e),
                }
            }
            // Always attempt the explicitly supplied restoration values.
            let restored = apply(&restore_color, &restore_brightness)
                .await
                .expect("Failed to restore keyboard");
            assert_eq!(restored.status, "applied", "{}", restored.message);
            assert!(failures.is_empty(), "{failures:?}");
        });
    }
}
