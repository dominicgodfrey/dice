// Design tokens (PLAN.md D33, D37). One neutral ground, white surfaces, a
// restrained tile palette the student can choose from, Inter throughout.

export const colors = {
  bg: "#F3F3F1",
  surface: "#FFFFFF",
  surfaceMuted: "#EDEDEA",
  text: "#161616",
  muted: "#6B6B6B",
  faint: "#A3A3A0",
  border: "#E2E2DF",
  accent: "#1F4E79",
  danger: "#B42318",
  success: "#1E7A44",
  warning: "#B7791F",
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.72)",
  onDarkFaint: "rgba(255,255,255,0.45)",
  onDarkLine: "rgba(255,255,255,0.18)",
  onDarkFill: "rgba(255,255,255,0.12)",
};

/** Tile colours. All deep enough for white text. */
export const palette = {
  ink: { name: "Ink", color: "#1C2333" },
  ocean: { name: "Ocean", color: "#245A8C" },
  teal: { name: "Teal", color: "#0E6B63" },
  moss: { name: "Moss", color: "#3D6B45" },
  amber: { name: "Amber", color: "#9A6A1E" },
  clay: { name: "Clay", color: "#A0492E" },
  plum: { name: "Plum", color: "#5C3D7A" },
  slate: { name: "Slate", color: "#4A5160" },
} as const;

export type PaletteKey = keyof typeof palette;

export const PALETTE_KEYS = Object.keys(palette) as PaletteKey[];

export function isPaletteKey(k: string | undefined): k is PaletteKey {
  return k !== undefined && k in palette;
}

export const radius = { tile: 16, card: 12, control: 10, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

/** Type scale: size and line height. */
export const type = {
  display: { fontSize: 28, lineHeight: 34 },
  title: { fontSize: 22, lineHeight: 28 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, lineHeight: 16 },
  stat: { fontSize: 32, lineHeight: 36 },
};
