import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  value: number; // 0..100
}

export function ProgressBar({ value }: ProgressBarProps) {
  const colors = useColors();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: colors.primary, width: `${clamped}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
