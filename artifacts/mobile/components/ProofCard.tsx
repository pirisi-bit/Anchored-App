import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { Anchor, Proof } from "@/lib/storage";
import { categoryColor } from "@/lib/categories";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/lang-context";
import { StatusBadge } from "./StatusBadge";

interface ProofCardProps {
  proof: Proof;
  anchor?: Anchor;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function ProofCard({ proof, anchor }: ProofCardProps) {
  const colors = useColors();
  const router = useRouter();
  const t = useT();
  if (!anchor) return null;

  return (
    <Pressable
      onPress={() => router.push(`/proof/${proof.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View
            style={[
              styles.dot,
              { backgroundColor: categoryColor(anchor.category, colors) },
            ]}
          />
          <Text style={[styles.name, { color: colors.foreground }]}>
            {t.templateNames[anchor.name] ?? anchor.name}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatTime(proof.createdAt)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <StatusBadge status={proof.status} />
        {proof.photoUrl ? (
          <Image
            source={{ uri: proof.photoUrl }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    flexShrink: 1,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
});
