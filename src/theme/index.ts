/**
 * Shared design tokens for the Capella Room mobile app.
 *
 * These values mirror the CSS custom properties defined in
 * `prototype/tokens/shared.css`, `prototype/tokens/mobile.css` and
 * `src/global.css`. Use them when a value cannot be expressed through a
 * NativeWind utility class (e.g., dynamic colors, programmatic shadows,
 * React Native animated values).
 */

/** Brand and semantic color palette (light mode). */
export const lightColors = {
  cream: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  surfaceWarm: "#F8FAFC",
  purple: "#2563EB",
  purpleSoft: "#1D4ED8",
  purpleLight: "#DBEAFE",
  purplePale: "#93C5FD",
  peach: "#F4A261",
  peachLight: "#FFF0E0",
  peachPale: "#FCD5A8",
  mint: "#5EC4A0",
  mintLight: "#E0F7EE",
  mintPale: "#A7E8C9",
  rose: "#E8788A",
  roseLight: "#FFE8EC",
  rosePale: "#F5B5C0",
  roseSoft: "#F09BAA",
  amber: "#E8B44A",
  amberLight: "#FFF5DC",
  ink: "#1E293B",
  ink2: "#334155",
  ink3: "#94A3B8",
  ink4: "#CBD5E1",
  inkAlt: "#0F172A",
  inkSurface: "#334155",
  border: "#E8EDF3",
  borderSoft: "#E8EDF3",
  mintText: "#3A9B74",
  peachText: "#C47A30",
  roseText: "#A8445A",
  amberText: "#7A6318",
  amberDark: "#9B7A1C",
  authPurple: "#EFF6FF",
  authPeach: "#FFF7ED",
  authMint: "#ECFDF5",
  frameBg: "#E2E8F0",
  frameMid: "#475569",
  glassBg: "rgba(255, 255, 255, 0.7)",
  glassHeavy: "rgba(255, 255, 255, 0.85)",
  glassBorder: "rgba(255, 255, 255, 0.8)",
  creamAlpha: "rgba(247, 249, 252, 0.85)",
  creamAlpha95: "rgba(247, 249, 252, 0.95)",
} as const;

/** Brand and semantic color palette (dark mode). */
export const darkColors = {
  cream: "#0B1120",
  surface: "#151C2C",
  surfaceAlt: "#1E293B",
  surfaceWarm: "#1A2332",
  purple: "#3B82F6",
  purpleSoft: "#60A5FA",
  purpleLight: "rgba(59, 130, 246, 0.2)",
  purplePale: "rgba(96, 165, 250, 0.35)",
  peach: "#F4A261",
  peachLight: "rgba(244, 162, 97, 0.18)",
  peachPale: "rgba(244, 162, 97, 0.35)",
  mint: "#5EC4A0",
  mintLight: "rgba(94, 196, 160, 0.18)",
  mintPale: "rgba(94, 196, 160, 0.35)",
  rose: "#E8788A",
  roseLight: "rgba(232, 120, 138, 0.18)",
  rosePale: "rgba(232, 120, 138, 0.35)",
  roseSoft: "#F09BAA",
  amber: "#E8B44A",
  amberLight: "rgba(232, 180, 74, 0.18)",
  ink: "#F8FAFC",
  ink2: "#E2E8F0",
  ink3: "#94A3B8",
  ink4: "#64748B",
  inkAlt: "#F1F5F9",
  inkSurface: "#334155",
  border: "rgba(255, 255, 255, 0.08)",
  borderSoft: "rgba(255, 255, 255, 0.06)",
  mintText: "#6EE7B7",
  peachText: "#FDBA74",
  roseText: "#FDA4AF",
  amberText: "#FDE68A",
  amberDark: "#FDE68A",
  authPurple: "rgba(59, 130, 246, 0.12)",
  authPeach: "rgba(244, 162, 97, 0.08)",
  authMint: "rgba(94, 196, 160, 0.08)",
  frameBg: "#020617",
  frameMid: "#1E293B",
  glassBg: "rgba(21, 28, 44, 0.75)",
  glassHeavy: "rgba(15, 23, 42, 0.92)",
  glassBorder: "rgba(255, 255, 255, 0.06)",
  creamAlpha: "rgba(11, 17, 32, 0.9)",
  creamAlpha95: "rgba(11, 17, 32, 0.95)",
} as const;

/**
 * Legacy light-only palette export for compatibility.
 * Prefer `useThemeColors()` when both modes matter.
 */
export const colors = lightColors;

/** Font families used across the app. */
export const fonts = {
  sans: "Inter",
  display: "SpaceGrotesk",
  hand: "Caveat",
} as const;

/** Standard spacing scale (in logical pixels). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  "5xl": 40,
} as const;

/** Shadow opacity presets for iOS shadows. */
export const shadows = {
  xs: 0.04,
  sm: 0.06,
  md: 0.08,
  lg: 0.15,
  xl: 0.25,
} as const;

/** Animation easing matching the prototype. */
export const easings = {
  smooth: [0.16, 1, 0.3, 1],
  ease: [0.25, 0.1, 0.25, 1],
} as const;

/** Animation durations used in the prototype. */
export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  page: 0.45,
} as const;
