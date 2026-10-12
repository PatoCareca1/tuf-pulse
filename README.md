# TUF Pulse

Keyboard lighting, made simple. A desktop RGB panel for ASUS TUF laptops on Arch Linux and Omarchy.

**Stage: project definition + interactive design prototype. The desktop app is not implemented yet.**

## Preview

Open `prototype/index.html` in your browser. It works offline, simulates a single-zone keyboard, saves local presets, and never controls hardware. Animated previews are design experiments, not a compatibility claim.

The concept uses graphite panels, mint accents, a keyboard preview, a color picker, brightness controls, and local presets. Open the HTML file to explore it.

## Product

Start with one well-tested laptop: **TUF Gaming A16 FA607NUQ**. Make color, brightness and saved profiles effortless. Show only controls backed by detected capabilities. Add reliable Hyprland shortcuts, then broaden the compatibility matrix with community reports.

## Planned stack

| Layer | Choice |
| --- | --- |
| Desktop shell | Tauri 2 |
| UI | React + TypeScript + Vite + CSS variables |
| Native application logic | Rust |
| Initial hardware adapter | Allowlisted `asusctl` 6.x subprocesses |
| Later hardware adapter | Typed D-Bus access to `asusd`, if justified |
| Local profiles | Versioned JSON in the XDG config directory |
| Shortcuts | Small CLI sharing the native core + explicit Hyprland bindings |
| Tests | Vitest, Rust unit tests, hardware smoke tests |
| Delivery | Arch package / AUR after a validated release; GitHub Actions |

There is no cloud backend, account, database server, or telemetry in the MVP.

## Confirmed hardware baseline

The owner's `asusctl info --show-supported` reports `Static`, brightness `Off / Low / Med / High`, no independently addressable Aura zones, and keyboard power support. Changing the static color was reported successful.

Native breathing, color cycling, and pulse remain **unverified on this installation**. TUFRGB publishes a FA607NUQ mapping that advertises those modes; that is a useful lead, not a replacement for testing. A single-zone keyboard cannot display a left-to-right color gradient or individual-key colors.

## Start here

1. Read [scope and MVP](docs/01-mvp.md).
2. Review [hardware evidence](docs/02-hardware.md).
3. Explore `prototype/index.html`.
4. Run `bash scripts/diagnose.sh` on the ASUS and review its output locally.
5. Implement issue 01 from [the backlog](docs/05-backlog.md).

## Publish the prepared Git repository

After extracting the ZIP, run inside `tuf-pulse`:

```bash
gh repo create tuf-pulse --public --source=. --remote=origin --push
```

This creates a **public** repository in the account authenticated by `gh`. The supplied repository currently has no remote. Choose another name if needed. GitHub CLI must already be installed and authenticated.

## Em português

Um painel bonito e simples para controlar a iluminação dos teclados ASUS TUF no Linux. O primeiro alvo é o FA607NUQ com Arch/Omarchy. Nesta entrega há planejamento, contratos e protótipo navegável; integração real com o teclado será a próxima etapa.

Projeto independente. ASUS/TUF identificam o hardware compatível e não representam parceria ou endosso. Código original sob licença MIT; ferramentas externas conservam suas próprias licenças.
