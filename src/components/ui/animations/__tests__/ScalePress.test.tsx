/**
 * Tests for ScalePress animation wrapper.
 */

import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ScalePress } from "../ScalePress";

const mockUseReducedMotion = jest.fn();

jest.mock("react-native-reanimated", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

jest.mock("moti/interactions", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    MotiPressable: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => <View {...props}>{children}</View>,
  };
});

jest.mock("@/lib/hooks/useSettingsQuery", () => ({
  useSettings: () => ({ data: undefined }),
  settingsKeys: { all: ["settings"] },
}));

describe("ScalePress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("renders its children", async () => {
    const { getByText } = await render(
      <ScalePress testID="scale-press">
        <Text>Press me</Text>
      </ScalePress>,
    );

    expect(getByText("Press me")).toBeTruthy();
  });

  it("forwards the disabled prop", async () => {
    const { getByTestId } = await render(
      <ScalePress testID="scale-press" disabled>
        <Text>Disabled</Text>
      </ScalePress>,
    );

    expect(getByTestId("scale-press").props.disabled).toBe(true);
  });
});
