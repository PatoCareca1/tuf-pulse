/** Design contract only. No hardware implementation is provided yet. */
export type Brightness = "off" | "low" | "med" | "high";
export type NativeEffect = "static" | "breathe" | "rainbow-cycle" | "pulse";
export type Support = "confirmed" | "unverified" | "unsupported";

export interface Capabilities {
  model: string;
  adapterVersion: string;
  connection: "ready" | "missing-tool" | "daemon-unavailable" | "unknown";
  /** null means unknown; zero is never inferred from an empty Aura zone list. */
  independentZoneCount: number | null;
  brightness: Brightness[];
  effects: Partial<Record<NativeEffect, Support>>;
}

export interface Profile {
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
  /** Null when state cannot be read reliably, e.g. after external changes. */
  color: string | null;
  brightness: Brightness | null;
  effect: NativeEffect | null;
}

export type ApplyResult =
  | { status: "applied"; confirmedState: LightingState }
  | { status: "partial" | "failed"; confirmedState: LightingState; message: string };

export interface LightingAdapter {
  getCapabilities(): Promise<Capabilities>;
  getState(): Promise<LightingState>;
  applyStatic(color: string): Promise<ApplyResult>;
  setBrightness(brightness: Brightness): Promise<ApplyResult>;
}
