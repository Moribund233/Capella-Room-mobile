/**
 * Tests for SlideUpModal animation wrapper.
 */

import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SlideUpModal } from "../SlideUpModal";

const mockUseReducedMotion = jest.fn();

jest.mock("react-native-reanimated", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

jest.mock("moti", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock("@/lib/hooks/useSettingsQuery", () => ({
  useSettings: () => ({ data: undefined }),
  settingsKeys: { all: ["settings"] },
}));

describe("SlideUpModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("renders children when visible", async () => {
    const { getByText } = await render(
      <SlideUpModal visible onClose={jest.fn()}>
        <Text>Modal content</Text>
      </SlideUpModal>,
    );

    expect(getByText("Modal content")).toBeTruthy();
  });

  it("does not render children when hidden", async () => {
    const { queryByText } = await render(
      <SlideUpModal visible={false} onClose={jest.fn()}>
        <Text>Hidden content</Text>
      </SlideUpModal>,
    );

    expect(queryByText("Hidden content")).toBeNull();
  });
});
