use crate::adapter::{validate_brightness, validate_color};
use serde::{Deserialize, Serialize};
use std::{
    io::{Read, Write},
    path::{Path, PathBuf},
};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Profile {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    pub color: String,
    pub brightness: String,
    pub effect: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileFile {
    pub schema_version: u32,
    pub profiles: Vec<Profile>,
    pub last_selected_profile_id: Option<String>,
}
impl Default for ProfileFile {
    fn default() -> Self {
        Self {
            schema_version: 1,
            profiles: vec![],
            last_selected_profile_id: None,
        }
    }
}
pub fn config_path() -> Result<PathBuf, String> {
    let base = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .filter(|p| p.is_absolute())
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
        .ok_or("Diretório XDG/HOME indisponível.")?;
    Ok(base.join("tuf-pulse/profiles.json"))
}
pub fn validate(file: &ProfileFile) -> Result<(), String> {
    if file.schema_version != 1 {
        return Err("Versão de perfis desconhecida; arquivo preservado.".into());
    }
    if file.profiles.len() > 20 {
        return Err("Limite de 20 perfis.".into());
    }
    let mut ids = std::collections::HashSet::new();
    for p in &file.profiles {
        if p.id.is_empty() || p.id.len() > 80 || !ids.insert(&p.id) {
            return Err("ID de perfil inválido ou duplicado.".into());
        }
        if p.name.trim().is_empty()
            || p.name.chars().count() > 32
            || p.name.chars().any(char::is_control)
        {
            return Err("Nome deve ter de 1 a 32 caracteres, sem controles.".into());
        }
        if p.icon
            .as_deref()
            .is_some_and(|icon| !["work", "code", "game", "incognito"].contains(&icon))
        {
            return Err("Ícone de perfil desconhecido.".into());
        }
        validate_color(&p.color)?;
        validate_brightness(&p.brightness)?;
        if p.effect != "static" {
            return Err("Somente perfis de cor fixa são permitidos.".into());
        }
    }
    if file
        .last_selected_profile_id
        .as_ref()
        .is_some_and(|id| !ids.contains(id))
    {
        return Err("Perfil selecionado inexistente.".into());
    }
    Ok(())
}
pub fn load(path: &Path) -> Result<ProfileFile, String> {
    let input = match std::fs::File::open(path) {
        Ok(f) => f,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(ProfileFile::default()),
        Err(e) => return Err(format!("Não foi possível ler {}: {e}", path.display())),
    };
    let mut bytes = Vec::new();
    input
        .take(65537)
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Não foi possível ler {}: {e}", path.display()))?;
    if bytes.len() > 65536 {
        return Err("Arquivo de perfis excede 64 KiB; preservado.".into());
    }
    let file = serde_json::from_slice(&bytes).map_err(|e| {
        format!(
            "Perfis inválidos em {}: {e}. Arquivo preservado; cor e brilho continuam disponíveis.",
            path.display()
        )
    })?;
    validate(&file)?;
    Ok(file)
}
pub fn save(path: &Path, file: &ProfileFile) -> Result<(), String> {
    validate(file)?;
    // Refuse to overwrite malformed or future-version files.
    load(path)?;
    let parent = path.parent().ok_or("Caminho de perfis inválido.")?;
    std::fs::create_dir_all(parent)
        .map_err(|e| format!("Não foi possível criar diretório de perfis: {e}"))?;
    let mut temp = tempfile::NamedTempFile::new_in(parent)
        .map_err(|e| format!("Não foi possível criar arquivo temporário: {e}"))?;
    serde_json::to_writer_pretty(&mut temp, file).map_err(|e| e.to_string())?;
    temp.write_all(b"\n")
        .and_then(|_| temp.as_file().sync_all())
        .map_err(|e| e.to_string())?;
    temp.persist(path)
        .map_err(|e| format!("Não foi possível salvar perfis: {e}"))?;
    std::fs::File::open(parent)
        .and_then(|f| f.sync_all())
        .map_err(|e| format!("Perfis escritos, mas sincronização do diretório falhou: {e}"))?;
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> ProfileFile {
        ProfileFile {
            profiles: vec![Profile {
                id: "one".into(),
                name: "Cyber".into(),
                icon: None,
                color: "4de8d1".into(),
                brightness: "low".into(),
                effect: "static".into(),
            }],
            last_selected_profile_id: Some("one".into()),
            ..Default::default()
        }
    }
    #[test]
    fn persists_after_reopen_and_delete() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("tuf-pulse/profiles.json");
        assert!(load(&p).unwrap().profiles.is_empty());
        save(&p, &sample()).unwrap();
        let mut f = load(&p).unwrap();
        assert_eq!(f.profiles[0].brightness, "low");
        assert_eq!(f.last_selected_profile_id.as_deref(), Some("one"));
        f.profiles[0].name = "Renamed".into();
        save(&p, &f).unwrap();
        assert_eq!(load(&p).unwrap().profiles[0].name, "Renamed");
        save(&p, &ProfileFile::default()).unwrap();
        assert!(load(&p).unwrap().profiles.is_empty());
        assert_eq!(std::fs::read_dir(p.parent().unwrap()).unwrap().count(), 1);
    }
    #[test]
    fn preserves_invalid_and_future_files() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("profiles.json");
        for bytes in [
            "broken",
            "{\"schemaVersion\":2,\"profiles\":[],\"lastSelectedProfileId\":null}",
        ] {
            std::fs::write(&p, bytes).unwrap();
            assert!(load(&p).is_err());
            assert!(save(&p, &sample()).is_err());
            assert_eq!(std::fs::read_to_string(&p).unwrap(), bytes);
        }
    }
    #[test]
    fn rejects_bad_profiles_and_dangling_selection() {
        let mut f = sample();
        f.profiles.push(f.profiles[0].clone());
        assert!(validate(&f).is_err());
        let mut f = sample();
        f.profiles[0].color = ";rm -r".into();
        assert!(validate(&f).is_err());
        let mut f = sample();
        f.profiles[0].effect = "breathe".into();
        assert!(validate(&f).is_err());
        let mut f = sample();
        f.profiles.clear();
        assert!(validate(&f).is_err());
    }
    #[test]
    fn icons_are_optional_validated_and_persisted() {
        let old = r#"{"schemaVersion":1,"profiles":[{"id":"one","name":"Cyber","color":"4de8d1","brightness":"low","effect":"static"}],"lastSelectedProfileId":"one"}"#;
        let f: ProfileFile = serde_json::from_str(old).unwrap();
        assert!(f.profiles[0].icon.is_none());
        validate(&f).unwrap();
        let d = tempfile::tempdir().unwrap();
        let path = d.path().join("profiles.json");
        let mut f = f;
        f.profiles[0].icon = Some("incognito".into());
        save(&path, &f).unwrap();
        assert_eq!(
            load(&path).unwrap().profiles[0].icon.as_deref(),
            Some("incognito")
        );
        f.profiles[0].icon = Some("unknown".into());
        assert!(save(&path, &f).is_err());
        assert_eq!(
            load(&path).unwrap().profiles[0].icon.as_deref(),
            Some("incognito")
        );
    }
    #[test]
    fn oversized_and_hostile_files_are_preserved() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("profiles.json");
        for bytes in [
            vec![b' '; 100_000],
            br#"{"schemaVersion":1,"profiles":[],"lastSelectedProfileId":null,"unexpected":true}"#
                .to_vec(),
        ] {
            std::fs::write(&p, &bytes).unwrap();
            assert!(load(&p).is_err());
            assert!(save(&p, &sample()).is_err());
            assert_eq!(std::fs::read(&p).unwrap(), bytes);
        }
        for value in ["$(touch /tmp/injected)", "ffffff;", "\0", "💡"] {
            let mut f = sample();
            f.profiles[0].color = value.into();
            assert!(validate(&f).is_err());
            f = sample();
            f.profiles[0].brightness = value.into();
            assert!(validate(&f).is_err());
        }
    }
    #[test]
    fn failed_write_keeps_existing_data() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("profiles.json");
        save(&p, &sample()).unwrap();
        let mut invalid = sample();
        invalid.profiles[0].brightness = "max".into();
        assert!(save(&p, &invalid).is_err());
        assert_eq!(load(&p).unwrap().profiles[0].brightness, "low");
        let blocked = d.path().join("not-a-directory");
        std::fs::write(&blocked, "keep").unwrap();
        assert!(save(&blocked.join("profiles.json"), &sample()).is_err());
        assert_eq!(std::fs::read_to_string(blocked).unwrap(), "keep");
    }
}
