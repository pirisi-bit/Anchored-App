import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Anchor, Proof } from "@/lib/storage";
import { categoryColor } from "@/lib/categories";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";

interface AnchorCardProps {
  anchor: Anchor;
  proof?: Proof;
  highlighted?: boolean;
  onSelfConfirm: () => void;
  onPhoto: () => void;
  onReceipt: () => void;
  onViewProof: () => void;
}

function ActionButton({
  icon,
  label,
  onPress,
  filled,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const colors = useColors();
  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: filled ? colors.primary : colors.card,
          borderColor: filled ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={filled ? colors.primaryForeground : colors.foreground}
      />
      <Text
        style={[
          styles.actionLabel,
          { color: filled ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AnchorCard({
  anchor,
  proof,
  highlighted,
  onSelfConfirm,
  onPhoto,
  onReceipt,
  onViewProof,
}: AnchorCardProps) {
  const colors = useColors();
  const isDone = !!proof;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        highlighted && {
          borderColor: colors.primary,
          borderWidth: 2,
          shadowColor: colors.primary,
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 4,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: categoryColor(anchor.category, colors) },
          ]}
        />
        <View style={styles.titleWrap}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {anchor.name}
          </Text>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {anchor.category}
          </Text>
        </View>
        <StatusBadge status={proof ? proof.status : "Unverified"} />
      </View>

      {!isDone ? (
        <View style={styles.actions}>
          <ActionButton icon="check" label="Confirm" onPress={onSelfConfirm} />
          <ActionButton icon="camera" label="Photo" onPress={onPhoto} />
          <ActionButton
            icon="file-text"
            label="Receipt"
            onPress={onReceipt}
            filled
          />
        </View>
      ) : (
        <Pressable onPress={onViewProof} hitSlop={8}>
          <Text style={[styles.viewProof, { color: colors.primary }]}>
            View Proof →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  viewProof: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    paddingTop: 2,
  },
});
