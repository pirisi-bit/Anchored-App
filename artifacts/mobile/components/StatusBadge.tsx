import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ProofStatus } from "@/lib/storage";
import { useColors } from "@/hooks/useColors";

interface StatusBadgeProps {
  status: ProofStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useColors();

  if (status === "Verified") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(107,203,119,0.15)" }]}>
        <Feather name="check-circle" size={13} color={colors.brandSage} />
        <Text style={[styles.label, { color: colors.brandSage }]}>Verified</Text>
      </View>
    );
  }

  if (status === "Self-confirmed") {
    return (
      <View style={[styles.badge, { backgroundColor: "rgba(255,217,61,0.22)" }]}>
        <Feather name="check-circle" size={13} color="#B45309" />
        <Text style={[styles.label, { color: "#B45309" }]}>Self-confirmed</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.muted }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Unverified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
