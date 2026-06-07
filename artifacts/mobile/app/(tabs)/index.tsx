import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { AnchorCard } from "@/components/AnchorCard";
import { ProgressBar } from "@/components/ProgressBar";
import { CaptureSheet, type CaptureMode } from "@/components/CaptureSheet";
import type { Anchor } from "@/lib/storage";

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { focusAnchor, focusKey } = useLocalSearchParams<{
    focusAnchor?: string;
    focusKey?: string;
  }>();
  const {
    anchors,
    loading,
    getTodayProof,
    selfConfirm,
    addPhotoProof,
    addReceiptProof,
    refresh,
  } = useAnchors();

  const [capture, setCapture] = useState<{
    anchor: Anchor;
    mode: CaptureMode;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const cardOffsets = useRef<Record<string, number>>({});
  const handledFocus = useRef<string | null>(null);

  const activeAnchors = useMemo(
    () => anchors.filter((a) => a.active),
    [anchors],
  );

  useEffect(() => {
    if (loading) return;
    if (!focusAnchor) return;
    const focusToken = `${focusAnchor}:${focusKey ?? ""}`;
    if (handledFocus.current === focusToken) return;

    const target = activeAnchors.find(
      (a) => a.id === focusAnchor && !getTodayProof(a.id),
    );
    if (!target) {
      handledFocus.current = focusToken;
      return;
    }
    handledFocus.current = focusToken;

    const scrollToCard = () => {
      const y = cardOffsets.current[focusAnchor];
      if (typeof y === "number") {
        scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
      }
    };
    const scrollTimer = setTimeout(scrollToCard, 350);
    setHighlightId(focusAnchor);
    const clearTimer = setTimeout(() => setHighlightId(null), 2600);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [focusAnchor, focusKey, loading, activeAnchors, getTodayProof]);

  const doneCount = useMemo(
    () => activeAnchors.filter((a) => getTodayProof(a.id)).length,
    [activeAnchors, getTodayProof],
  );

  const total = activeAnchors.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 8;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleUploaded = async (url: string) => {
    if (!capture) return;
    const { anchor, mode } = capture;
    if (mode === "photo") {
      await addPhotoProof(anchor.id, url);
    } else {
      await addReceiptProof(anchor.id, url);
    }
    setCapture(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {todayLabel()}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Today</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <View
              style={[
                styles.progressCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.progressTop}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  Daily progress
                </Text>
                <Text style={[styles.progressCount, { color: colors.primary }]}>
                  {doneCount}/{total}
                </Text>
              </View>
              <ProgressBar value={percent} />
              <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
                {total === 0
                  ? "Add anchors to start tracking."
                  : percent === 100
                    ? "All anchors verified today. Nice work."
                    : `${percent}% done — keep it up.`}
              </Text>
            </View>

            {total === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No active anchors yet.
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Set up the routines you want to prove each day.
                </Text>
                <Text
                  onPress={() => router.push("/onboarding")}
                  style={[styles.link, { color: colors.primary }]}
                >
                  Add anchors →
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {activeAnchors.map((anchor) => {
                  const proof = getTodayProof(anchor.id);
                  return (
                    <View
                      key={anchor.id}
                      onLayout={(e) => {
                        cardOffsets.current[anchor.id] =
                          e.nativeEvent.layout.y;
                      }}
                    >
                      <AnchorCard
                        anchor={anchor}
                        proof={proof}
                        highlighted={highlightId === anchor.id}
                        onSelfConfirm={() => selfConfirm(anchor.id)}
                        onPhoto={() => setCapture({ anchor, mode: "photo" })}
                        onReceipt={() => setCapture({ anchor, mode: "receipt" })}
                        onViewProof={() =>
                          proof && router.push(`/proof/${proof.id}`)
                        }
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {capture ? (
        <CaptureSheet
          visible
          mode={capture.mode}
          anchorName={capture.anchor.name}
          onClose={() => setCapture(null)}
          onUploaded={handleUploaded}
        />
      ) : null}
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
  header: { marginBottom: 20 },
  date: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  loading: { paddingVertical: 60, alignItems: "center" },
  progressCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    marginBottom: 24,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressCount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  progressHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  list: { gap: 14 },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 260,
  },
  link: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
});
