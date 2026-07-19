/**
 * Tests for useAnimationDisabled hook.
 */

import { renderHook } from "@testing-library/react-native";
import { useAnimationDisabled } from "../useAnimationDisabled";

const mockUseReducedMotion = jest.fn();
const mockUseSettings = jest.fn();

jest.mock("react-native-reanimated", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

jest.mock("../useSettingsQuery", () => ({
  useSettings: () => mockUseSettings(),
  settingsKeys: { all: ["settings"] },
}));

describe("useAnimationDisabled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when the system requests reduced motion", async () => {
    mockUseReducedMotion.mockReturnValue(true);
    mockUseSettings.mockReturnValue({ data: undefined });

    const { result } = await renderHook(() => useAnimationDisabled());

    expect(result.current).toBe(true);
  });

  it("returns true when the user setting requests reduced motion", async () => {
    mockUseReducedMotion.mockReturnValue(false);
    mockUseSettings.mockReturnValue({
      data: { accessibility: { reduce_motion: true } },
    });

    const { result } = await renderHook(() => useAnimationDisabled());

    expect(result.current).toBe(true);
  });

  it("returns false when neither system nor user requests reduced motion", async () => {
    mockUseReducedMotion.mockReturnValue(false);
    mockUseSettings.mockReturnValue({
      data: { accessibility: { reduce_motion: false } },
    });

    const { result } = await renderHook(() => useAnimationDisabled());

    expect(result.current).toBe(false);
  });

  it("defaults to false when settings are not loaded", async () => {
    mockUseReducedMotion.mockReturnValue(false);
    mockUseSettings.mockReturnValue({ data: undefined });

    const { result } = await renderHook(() => useAnimationDisabled());

    expect(result.current).toBe(false);
  });
});
