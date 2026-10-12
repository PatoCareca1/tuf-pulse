use serde::Serialize;
use std::collections::BTreeMap;
use tokio::{
    process::Command,
    time::{timeout, Duration},
};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Capabilities {
    pub model: String,
    pub adapter_version: String,
    pub connection: String,
    pub independent_zone_count: Option<u32>,
    pub brightness: Vec<String>,
    pub effects: BTreeMap<String, String>,
    pub message: String,
}

pub fn validate_color(color: &str) -> Result<(), String> {
    if color.len() == 6 && color.bytes().all(|b| b.is_ascii_hexdigit()) {
        Ok(())
    } else {
        Err("Use exatamente seis caracteres hexadecimais (0–9, A–F).".into())
    }
}
pub fn validate_brightness(level: &str) -> Result<(), String> {
    if ["off", "low", "med", "high"].contains(&level) {
        Ok(())
    } else {
        Err("Brilho inválido: use off, low, med ou high.".into())
    }
}

pub async fn run(args: &[&str]) -> Result<String, String> {
    execute("/usr/bin/asusctl", args, Duration::from_secs(8)).await
}
async fn execute(binary: &str, args: &[&str], limit: Duration) -> Result<String, String> {
    // Private runner; production callers only use the fixed asusctl path.
    let mut command = Command::new(binary);
    command.args(args).kill_on_drop(true);
    let output = timeout(limit, command.output())
        .await
        .map_err(|_| {
            "asusctl excedeu o limite de 8 segundos. Estado do teclado desconhecido.".to_string()
        })?
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "asusctl não encontrado em /usr/bin/asusctl. Instale o pacote asusctl.".into()
            } else {
                format!("Não foi possível executar asusctl: {e}")
            }
        })?;
    if !output.status.success() {
        return Err(format!("asusctl falhou ({}): {} {}. Verifique `systemctl status asusd.service`; se inativo, execute `sudo systemctl start asusd.service` no terminal.", output.status, String::from_utf8_lossy(&output.stderr).trim(), String::from_utf8_lossy(&output.stdout).trim()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

fn list<'a>(text: &'a str, label: &str) -> Option<Vec<&'a str>> {
    let tail = text.split_once(label)?.1.trim_start();
    let inner = tail.strip_prefix('[')?.split_once(']')?.0;
    Some(
        inner
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .collect(),
    )
}
pub fn parse(text: &str) -> Capabilities {
    let mut caps = Capabilities { model: std::fs::read_to_string("/sys/class/dmi/id/product_name").unwrap_or_else(|_| "Modelo desconhecido".into()).trim().into(), adapter_version: "desconhecida".into(), connection: "unknown".into(), independent_zone_count: None, brightness: vec![], effects: BTreeMap::new(), message: "Formato de capacidades incompleto ou desconhecido; controles não reconhecidos ficam desativados.".into() };
    if let Some(version) = text
        .lines()
        .find_map(|l| l.trim().strip_prefix("Software version:"))
    {
        caps.adapter_version = version.trim().into();
    }
    if let Some(levels) = list(text, "Supported Keyboard Brightness:") {
        caps.brightness = levels
            .iter()
            .map(|s| s.to_lowercase())
            .filter(|s| validate_brightness(s).is_ok())
            .collect();
    }
    if let Some(modes) = list(text, "Supported Aura Modes:") {
        if modes.contains(&"Static") {
            caps.effects.insert("static".into(), "confirmed".into());
        }
    }
    // Empty zones do not imply zero zones or per-key addressing.
    if list(text, "Supported Keyboard Brightness:").is_some()
        && list(text, "Supported Aura Modes:").is_some()
    {
        caps.connection = "ready".into();
        caps.message =
            "Capacidades anunciadas pelo asusctl. Apenas cor fixa é habilitada nesta versão."
                .into();
    }
    caps
}
pub async fn diagnose() -> Capabilities {
    match run(&["info", "--show-supported"]).await {
        Ok(text) => parse(&text),
        Err(error) => {
            let mut caps = parse("");
            caps.connection = if !std::path::Path::new("/usr/bin/asusctl").exists() {
                "missing-tool"
            } else {
                "unknown"
            }
            .into();
            caps.message = error;
            caps
        }
    }
}
pub fn parse_brightness(text: &str) -> Option<String> {
    let level = text
        .trim()
        .strip_prefix("Current keyboard led brightness:")?
        .trim()
        .to_lowercase();
    validate_brightness(&level).ok().map(|_| level)
}
pub async fn brightness() -> Option<String> {
    run(&["leds", "get"])
        .await
        .ok()
        .and_then(|s| parse_brightness(&s))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn process_timeout_and_missing_binary() {
        tauri::async_runtime::block_on(async {
            let error = execute("/usr/bin/sleep", &["2"], Duration::from_millis(30))
                .await
                .unwrap_err();
            assert!(error.contains("limite"));
            assert!(execute(
                "/nonexistent/tuf-pulse-asusctl",
                &[],
                Duration::from_secs(1)
            )
            .await
            .unwrap_err()
            .contains("não encontrado"));
        });
    }
    #[test]
    fn rejects_invalid_input() {
        for c in ["#abcdef", "abc", "gg0000", "ffffff;", "é1234"] {
            assert!(validate_color(c).is_err());
        }
        assert!(validate_color("DcE6fF").is_ok());
        assert!(validate_brightness("high").is_ok());
        assert!(validate_brightness("High").is_err());
    }
    #[test]
    fn fixture_capabilities() {
        let c = parse(include_str!("../../fixtures/fa607nuq-asusctl-6.4.0.txt"));
        assert_eq!(c.adapter_version, "6.4.0");
        assert_eq!(c.brightness, ["off", "low", "med", "high"]);
        assert_eq!(c.effects.get("static").unwrap(), "confirmed");
        assert_eq!(c.effects.len(), 1);
        assert_eq!(c.independent_zone_count, None);
        assert_eq!(parse("garbage").connection, "unknown");
    }
    #[test]
    fn parses_live_layout_and_brightness() {
        let c = parse("Supported Keyboard Brightness:\n[Off, Low]\nSupported Aura Modes:\n[Static]\nSupported Aura Zones:\n[]");
        assert_eq!(c.connection, "ready");
        assert_eq!(c.brightness, ["off", "low"]);
        assert_eq!(
            parse_brightness("Current keyboard led brightness: High\n"),
            Some("high".into())
        );
        assert_eq!(parse_brightness("unexpected High"), None);
    }
}
