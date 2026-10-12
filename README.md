# TUF Pulse

A local desktop panel for ASUS TUF keyboard lighting on Arch Linux / Omarchy, built with Tauri 2, React, TypeScript and Rust. No accounts, cloud or telemetry.

Implemented: device diagnosis, static color, four discrete brightness levels, uniform keyboard preview and local profiles (create, update/rename, delete, select and apply). The local Omarchy launch shortcut is configured; profile cycling through a standalone CLI, packaging, tray and autostart remain future work. The original offline design reference is in `prototype/index.html`; it never controls hardware.

## Install prerequisites (Arch)

```bash
sudo pacman -S --needed rust base-devel webkit2gtk-4.1 openssl librsvg
npm ci
```

Node/npm and `/usr/bin/asusctl` must be installed. This implementation was tested with Node 26.8.2, Rust 1.98.1 and asusctl 6.4.0. Dependency versions are recorded in `package-lock.json` and `src-tauri/Cargo.lock`.

Check the daemon without changing it:

```bash
bash scripts/diagnose.sh
systemctl status asusd.service
```

On this installation asusd is udev activated. If it is inactive, start it explicitly from a terminal with `sudo systemctl start asusd.service`. Do not use `enable` for this unit. The app runs as your normal user and never changes services or hardware support databases.

## Run locally

```bash
npm run tauri dev
```

On the tested Omarchy/Hyprland session, native Wayland produced a GDK protocol error, and XWayland with DMA-BUF produced GBM errors. This process-local workaround successfully displayed the panel:

```bash
GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 npm run tauri dev
```

This does not change global desktop configuration. `npm run dev` alone opens only the web frontend; hardware commands require the Tauri desktop shell.

Build an executable without a development server (no installer/package yet):

```bash
npm run tauri build -- --debug --no-bundle
GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/debug/tuf-pulse
```

For an optimized build, omit `--debug` and run `src-tauri/target/release/tuf-pulse`.

A janela inicial é compacta (400 × 360), com mínimo de 320 × 320. O fluxo principal é perfis salvos → cor e brilho → Prévia / Aplicar. O teclado aparece somente no modal de Prévia (fecha por Escape ou pelo botão ×); a edição abre pelo lápis ao lado de Perfis salvos e o diagnóstico abre sob demanda. Presets de cor aparecem como bolinhas; um slider de arraste seleciona os quatro níveis de brilho. Mensagens de sucesso são substituídas por um ✓ discreto, enquanto erros permanecem visíveis. A altura do painel se ajusta ao conteúdo, limitada ao monitor. Edição fica em modal; mais de seis perfis usam páginas para preservar os controles principais sem rolagem. Nesta instalação há uma regra específica para abrir o TUF Pulse flutuante e centralizado, sem dividir o espaço das outras janelas.

## Use / Em português

1. Confira o modelo, as capacidades e a conexão no painel; Atualizar diagnóstico lê novamente o dispositivo.
2. Escolha uma cor hexadecimal de seis caracteres e um brilho anunciado. Essas escolhas alteram apenas a prévia.
3. Clique **Aplicar no teclado** para enviar cor fixa e brilho. As operações são sequenciais, sem transação: uma falha no brilho após sucesso da cor aparece como aplicação parcial.
4. Informe um nome e use **Salvar novo**. Para alterar o nome/cor/brilho de um perfil, selecione-o e use **Atualizar selecionado**. No editor, escolha **Nome** ou um ícone (trabalho, programação, controle ou incógnito). O nome fica no tooltip e na identificação acessível. Clique no lápis ao lado de **Perfis salvos** para salvar, atualizar ou excluir o perfil selecionado.
5. Clicar em um perfil salvo aplica imediatamente sua cor e brilho. Alterar manualmente a cor ou o brilho exige **Aplicar no teclado**. Reabrir restaura a seleção salva, sem modificar o teclado automaticamente.

Profiles are versioned JSON at `$XDG_CONFIG_HOME/tuf-pulse/profiles.json`, falling back to `~/.config/tuf-pulse/profiles.json`. Writes use a temporary file in the same directory, fsync and atomic rename. Invalid or future-version files are preserved; the UI reports the error and disables profile writes. Inspect/back up that file before repairing it manually. Use one application instance at a time; cross-process profile coordination and the shortcuts CLI are not implemented.

A successful static-color command means asusctl accepted the color, not that the app measured the LEDs. Brightness is read back with `asusctl leds get`. Color is unknown on startup/refresh because this CLI does not provide a reliable color getter. External lighting changes require refreshing. Preview brightness is illustrative, not a measured percentage. Unknown capabilities stay unknown; no additional effects or per-key control are enabled.

## Quick access on this Omarchy installation

**Super+Shift+K** opens or focuses TUF Pulse. **Escape** closes the panel (when no operation is running); inside a modal it closes only that modal. The header × button also closes the panel. Applying a profile keeps the window open so success or errors remain visible.

The user configuration `~/.config/hypr/tuf-pulse.lua` uses the matching window class, floats/centers it at 400 × 360 and binds the shortcut through Omarchy's launch-or-focus helper. The main Hyprland config was backed up before adding `require("hypr.tuf-pulse")`; reload and configerrors validation passed. The source snippet is in `integrations/hyprland.lua`. `scripts/launch.sh` starts the built debug executable with the local WebKit workaround. Rebuild after code changes; update the launcher path if moving the repository. These Lua instructions target the locally installed Hyprland 0.56.2.

The custom color modal has a hue strip and a draggable saturation/value plane; arrow keys also adjust the plane. Hex entry remains available. **Usar cor** changes the panel selection; **Aplicar** sends manual changes to the keyboard.

## Checks

Hardware-free:

```bash
npm run build
npm test
cargo test --locked --manifest-path src-tauri/Cargo.toml
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Rust tests cover validation, fixture/live-output parsing, subprocess timeout, missing executable, partial application reporting and atomic profile persistence, including malformed/future files and failed writes. Frontend tests cover profile update/removal/selection.

The ignored hardware smoke test **changes the real keyboard** to Cyber and off/low/med/high, then attempts restoration. Before running, inspect current color and brightness and explicitly supply restoration values. It is excluded from normal tests. Example only when the previous state is known to be `dce6ff` / high:

```bash
TUF_PULSE_RESTORE_COLOR=dce6ff TUF_PULSE_RESTORE_BRIGHTNESS=high cargo test --manifest-path src-tauri/Cargo.toml hardware_smoke -- --ignored --nocapture
```

## Local validation evidence

On FA607NUQ with asusctl 6.4.0 and active asusd, the native application smoke test accepted Cyber at all four levels, read each brightness back successfully, then restored `dce6ff` / High. The owner confirmed that the desktop panel and ready diagnosis were visible using the workaround above. Physical color appearance and profile CRUD through the actual UI after reopening still require user validation; persistence reopening is covered by automated filesystem tests.

See [validation notes](docs/06-validation.md), [hardware evidence](docs/02-hardware.md), [scope](docs/01-mvp.md) and [architecture](docs/03-architecture.md). No commits or pushes were created by this implementation.

Independent MIT project. ASUS/TUF identify compatible hardware and imply no affiliation or endorsement.
