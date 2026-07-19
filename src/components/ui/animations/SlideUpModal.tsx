/**
 * Bottom-sheet-style modal container with a slide-up entrance animation.
 *
 * Falls back to a static View when reduced motion is enabled.
 */

import { Modal, Pressable, View, type ModalProps } from "react-native";
import { MotiView } from "moti";

import { useAnimationDisabled } from "@/lib/hooks/useAnimationDisabled";

interface SlideUpModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when the backdrop is pressed or back button is used. */
  onClose: () => void;
  /** Modal content. */
  children: React.ReactNode;
  /** Additional props passed to the underlying Modal. */
  modalProps?: Omit<
    ModalProps,
    "visible" | "transparent" | "animationType" | "onRequestClose"
  >;
}

/**
 * Render a slide-up modal.
 *
 * @param props - Modal props.
 * @returns A React element.
 */
export function SlideUpModal({
  visible,
  onClose,
  children,
  modalProps,
}: SlideUpModalProps) {
  const animationDisabled = useAnimationDisabled();

  return (
    <Modal
      {...modalProps}
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      {animationDisabled ? (
        <View className="rounded-t-3xl bg-surface px-4 pb-6 pt-3">{children}</View>
      ) : (
        <MotiView
          className="rounded-t-3xl bg-surface px-4 pb-6 pt-3"
          from={{ translateY: 200, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
        >
          {children}
        </MotiView>
      )}
    </Modal>
  );
}
