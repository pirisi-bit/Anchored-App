import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Anchor, Proof } from "@/lib/storage";
import { categoryColor } from "@/lib/categories";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/lang-context";
import { StatusBadge } from "./StatusBadge";

interface AnchorCardProps {
  anchor: Anchor;
  proof?: Proof;
  proofCount?: number;
  highlighted?: boolean;
  onSelfConfirm: () => void;
  onPhoto: () => void;
  onReceipt: () => void;
  onVoice: () => void;
  onReset: () => void;
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AnchorCard({
  anchor,
  proof,
  proofCount = 0,
  highlighted,
  onSelfConfirm,
  onPhoto,
  onReceipt,
  onVoice,
  onReset,
  onViewProof,
}: AnchorCardProps) {
  const colors = useColors();
  const t = useT();
  const isDone = !!proof;
  const [reVerifying, setReVerifying] = useState(false);
  const showPicker = !isDone || reVerifying;
  const lastTime = proof ? formatTime(proof.createdAt) : "";

  const runPicker = (action: () => void) => {
    setReVerifying(false);
    action();
  };

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
            {anchor.emoji ? `${anchor.emoji} ` : ""}{anchor.name}
          </Text>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {t.categories[anchor.category] ?? anchor.category}
          </Text>
        </View>
        <StatusBadge status={proof ? proof.status : "Unverified"} />
      </View>

      {isDone && !reVerifying ? (
        <Text style={[styles.summary, { color: colors.primary }]}>
          {proofCount > 1
            ? t.card.verifiedTimes(proofCount, lastTime)
            : t.card.verifiedOnce(lastTime)}
        </Text>
      ) : null}

      {showPicker ? (
        <View style={styles.pickerWrap}>
          {reVerifying ? (
            <Text style={[styles.pickerHint, { color: colors.mutedForeground }]}>
              {t.card.checkAgainHint}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <ActionButton
              icon="check"
              label={t.card.confirm}
              onPress={() => runPicker(onSelfConfirm)}
            />
            <ActionButton
              icon="camera"
              label={t.card.photo}
              onPress={() => runPicker(onPhoto)}
            />
            <ActionButton
              icon="file-text"
              label={t.card.receipt}
              onPress={() => runPicker(onReceipt)}
            />
            <ActionButton
              icon="mic"
              label={t.card.voice}
              onPress={() => runPicker(onVoice)}
              filled
            />
          </View>
          {reVerifying ? (
            <Pressable onPress={() => setReVerifying(false)} hitSlop={8}>
              <Text style={[styles.cancel, { color: colors.mutedForeground }]}>
                {t.settings.clearDialog.cancel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isDone && !reVerifying ? (
        <View style={styles.doneRow}>
          <Pressable onPress={onViewProof} hitSlop={8}>
            <Text style={[styles.viewProof, { color: colors.primary }]}>
              {t.card.viewProof}
            </Text>
          </Pressable>
          <View style={styles.doneActions}>
            <Pressable
              onPress={() => setReVerifying(true)}
              hitSlop={8}
              style={styles.iconAction}
            >
              <Feather name="plus" size={14} color={colors.primary} />
              <Text style={[styles.iconActionText, { color: colors.primary }]}>
                {t.card.logAnother}
              </Text>
            </Pressable>
            <Pressable onPress={onReset} hitSlop={8} style={styles.iconAction}>
              <Feather
                name="rotate-ccw"
                size={14}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.iconActionText, { color: colors.mutedForeground }]}
              >
                {t.card.undoLast}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
  summary: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  pickerWrap: {
    gap: 8,
  },
  pickerHint: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
  cancel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    paddingTop: 2,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewProof: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  doneActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
