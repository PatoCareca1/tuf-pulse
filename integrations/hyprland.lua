-- User overrides for Omarchy / Hyprland 0.56 (Lua configuration).
o.window("^(Tuf-pulse|dev.tufpulse.desktop)$", {
  float = true,
  center = true,
  size = { 400, 360 },
})
-- Replace the path if the repository is moved.
o.bind("SUPER + SHIFT + K", "TUF Pulse", {
  focus = "^Tuf-pulse$",
  launch = "/home/pato/Projects/Personal/tuf-pulse/scripts/launch.sh",
})
