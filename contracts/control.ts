/** Shared desktop data contracts. Capabilities are advertised, not visual verification. */
export type Brightness = "off" | "low" | "med" | "high";
export type NativeEffect = "static" | "breathe" | "rainbow-cycle" | "pulse";
export type Support = "confirmed" | "unverified" | "unsupported";

export interface Capabilities {
  message: string;
  model: string;
  adapterVersion: string;
  connection: "ready" | "missing-tool" | "daemon-unavailable" | "unknown";
  /** null means unknown; zero is never inferred from an empty Aura zone list. */
  independentZoneCount: number | null;
  brightness: Brightness[];
  effects: Partial<Record<NativeEffect, Support>>;
}

export type ProfileIconName = "work" | "code" | "game" | "incognito";

export interface Profile {
  /** Omitted/null retains the name-only presentation of older files. */
  icon?: ProfileIconName | null;
  id: string;
  name: string;
  /** Runtime validation must enforce exactly six hexadecimal digits. */
  color: string;
  brightness: Brightness;
  effect: "static";
}

export interface ProfileFile {
  schemaVersion: 1;
  profiles: Profile[];
  lastSelectedProfileId: string | null;
}

export interface LightingState {
  /** Last successful color command only; null on refresh, no reliable color readback. */
  color: string | null;
  brightness: Brightness | null;
  effect: NativeEffect | null;
}

export type ApplyResult =
  | { status: "applied"; confirmedState: LightingState; message: string }
  | { status: "partial" | "failed"; confirmedState: LightingState; message: string };

export interface LightingAdapter {
  getCapabilities(): Promise<Capabilities>;
  getState(): Promise<LightingState>;
  applyStatic(color: string): Promise<ApplyResult>;
  setBrightness(brightness: Brightness): Promise<ApplyResult>;
}
