import { useMemo } from "react";
import { View, Text, ScrollView, Switch, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { SlideUpModal } from "@/components/ui/animations/SlideUpModal";
import { ScalePress } from "@/components/ui/animations/ScalePress";

interface DrawerOption {
  label: string;
  icon?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  /** Render a Switch instead of chevron. The drawer stays open when toggled. */
  toggle?: boolean;
  toggleValue?: boolean;
}

interface SettingsDrawerProps {
  visible: boolean;
  title: string;
  options: DrawerOption[];
  onClose: () => void;
}

export function SettingsDrawer({
  visible,
  title,
  options,
  onClose,
}: SettingsDrawerProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const maxHeight = useMemo(() => Dimensions.get("window").height * 0.5, []);

  return (
    <SlideUpModal visible={visible} onClose={onClose}>
      <View className="px-5 pb-2 pt-3">
        <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-4/40" />
        <Text className="text-center text-[17px] font-display-bold text-ink">
          {title}
        </Text>
      </View>

      <View style={{ maxHeight }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 8,
          }}
        >
          {options.map((opt, i) => (
            <ScalePress
              key={i}
              onPress={() => {
                if (!opt.toggle) {
                  opt.onPress();
                  onClose();
                }
              }}
              disabled={false}
              className="flex-row items-center gap-3 border-b border-border-soft px-1 py-4"
            >
              {opt.icon && (
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-surface-alt">
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={opt.destructive ? "#E8788A" : "#475569"}
                  />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className={`text-[15px] font-sans-medium ${opt.destructive ? "text-rose" : "text-ink"}`}
                >
                  {opt.label}
                </Text>
              </View>
              {opt.toggle ? (
                <Switch
                  value={opt.toggleValue}
                  onValueChange={() => opt.onPress()}
                  trackColor={{ false: colors.border, true: colors.purple }}
                  thumbColor="white"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              ) : opt.value ? (
                <Text className="text-[13px] text-ink-3">{opt.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              )}
            </ScalePress>
          ))}
        </ScrollView>
      </View>
    </SlideUpModal>
  );
}
