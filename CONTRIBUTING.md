# Contributing

This project is at the definition/prototype stage. See `docs/05-backlog.md` before implementing a new feature. Keep changes small and reviewable.

Compatibility reports should include laptop model/board, kernel version, asusctl version, advertised capabilities and the effect actually observed. Do not include serial numbers, credentials, environment dumps, or unrelated personal data. A model listed by another project is a lead, not verified support here.

The visual prototype is independent from hardware. Contributions must preserve its simulation labels and the single-zone representation. Do not enable a hardware feature solely because its button can be drawn.

Once the desktop scaffold exists, pin dependency versions with generated lockfiles and document the native build. Hardware-free tests belong in CI; hardware tests remain an explicit local checklist.
