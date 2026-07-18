/**
 * Shared design tokens for the Capella Room mobile app.
 *
 * These values mirror the CSS custom properties defined in
 * `prototype/tokens/shared.css` and `prototype/tokens/mobile.css`.
 * Use them when a value cannot be expressed through a NativeWind utility
 * class (e.g., dynamic colors, programmatic shadows).
 */

/** Brand and semantic color palette. */
export const colors = {
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
  amber: "#E8B44A",
  amberLight: "#FFF5DC",
  ink: "#1E293B",
  ink2: "#334155",
  ink3: "#94A3B8",
  ink4: "#CBD5E1",
  inkAlt: "#0F172A",
  border: "#E8EDF3",
  borderSoft: "#E8EDF3",
  mintText: "#3A9B74",
  peachText: "#C47A30",
  roseText: "#A8445A",
  amberText: "#7A6318",
  authPurple: "#EFF6FF",
  authPeach: "#FFF7ED",
  authMint: "#ECFDF5",
  frameBg: "#E2E8F0",
  frameMid: "#475569",
} as const;

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
