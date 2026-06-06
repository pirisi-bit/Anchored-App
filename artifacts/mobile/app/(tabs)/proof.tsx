import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { ProofCard } from "@/components/ProofCard";
import type { Proof } from "@/lib/storage";

function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProofScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { proofs, anchors, loading } = useAnchors();

  const sections = useMemo(() => {
    const map = new Map<string, Proof[]>();
    for (const proof of proofs) {
      const list = map.get(proof.dateKey) ?? [];
      list.push(proof);
      map.set(proof.dateKey, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, list]) => [
        dateKey,
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      ] as const);
  }, [proofs]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 8;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Your Proof
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Timeline of completed anchors.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : proofs.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="check" size={34} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No proof yet.
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Start verifying your anchors on the Today tab.
            </Text>
          </View>
        ) : (
          <View style={styles.sections}>
            {sections.map(([dateKey, list]) => (
              <View key={dateKey} style={styles.section}>
                <Text
                  style={[
                    styles.sectionHeader,
                    {
                      color: colors.secondaryForeground,
                      backgroundColor: colors.secondary,
                    },
                  ]}
                >
                  {formatDateKey(dateKey)}
                </Text>
                <View style={styles.sectionList}>
                  {list.map((proof) => (
                    <ProofCard
                      key={proof.id}
                      proof={proof}
                      anchor={anchors.find((a) => a.id === proof.anchorId)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  header: { marginBottom: 24 },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  loading: { paddingVertical: 60, alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 250,
  },
  sections: { gap: 28 },
  section: { gap: 14 },
  sectionHeader: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  sectionList: { gap: 14 },
});
