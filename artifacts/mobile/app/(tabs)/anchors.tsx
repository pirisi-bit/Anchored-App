import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { categoryColor, CATEGORY_ORDER } from "@/lib/categories";
import type { Anchor } from "@/lib/storage";
import { CreateAnchorSheet } from "@/components/CreateAnchorSheet";

export default function AnchorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { anchors, loading, toggleAnchorActive } = useAnchors();
  const [createOpen, setCreateOpen] = useState(false);
  // Optimistic overrides: id → boolean. Applied on top of DB state so the
  // switch responds instantly even while the network call is in flight.
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});

  // Merge optimistic overrides into the displayed list.
  const displayAnchors = useMemo(
    () => anchors.map((a) => (a.id in activeOverrides ? { ...a, active: activeOverrides[a.id] } : a)),
    [anchors, activeOverrides],
  );

  // Group by category: predefined CATEGORY_ORDER first, then any custom categories.
  const grouped = useMemo(() => {
    const map = new Map<string, Anchor[]>();
    for (const anchor of displayAnchors) {
      const list = map.get(anchor.category) ?? [];
      list.push(anchor);
      map.set(anchor.category, list);
    }
    const knownCats = CATEGORY_ORDER.filter((c) => map.has(c));
    const customCats = [...map.keys()].filter((c) => !CATEGORY_ORDER.includes(c));
    return [...knownCats, ...customCats].map((c) => {
      const list = map.get(c)!;
      const sorted = [...list].sort((a, b) => {
        if (a.active === b.active) return 0;
        return a.active ? -1 : 1;
      });
      return [c, sorted] as const;
    });
  }, [displayAnchors]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 8;

  const handleToggle = async (anchor: Anchor, active: boolean) => {
    setActiveOverrides((prev) => ({ ...prev, [anchor.id]: active }));
    try {
      await toggleAnchorActive(anchor.id, active);
    } catch {
      setActiveOverrides((prev) => ({ ...prev, [anchor.id]: anchor.active }));
      Alert.alert(t.anchors.couldNotUpdate, t.anchors.tryAgain);
    } finally {
      setActiveOverrides((prev) => {
        const next = { ...prev };
        delete next[anchor.id];
        return next;
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.anchors.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t.anchors.subtitle}
          </Text>
        </View>

        {/* Create custom anchor shortcut */}
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [
            styles.createRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[styles.createIcon, { backgroundColor: colors.primary + "1A" }]}>
            <Feather name="edit-2" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.createLabel, { color: colors.foreground }]}>
            {t.anchors.createCustom}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : anchors.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t.anchors.noAnchors}
            </Text>
          </View>
        ) : (
          <View style={styles.groups}>
            {grouped.map(([category, list]) => {
              const activeList = list.filter((a) => a.active);
              const inactiveList = list.filter((a) => !a.active);

              return (
                <View key={category} style={styles.group}>
                  <View
                    style={[
                      styles.categoryChip,
                      { backgroundColor: categoryColor(category, colors) },
                    ]}
                  >
                    <Text style={styles.categoryChipText}>
                      {t.categories[category] ?? category}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.groupCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    {/* Active anchors */}
                    {activeList.map((anchor, i) => (
                      <View
                        key={anchor.id}
                        style={[
                          styles.row,
                          (i !== activeList.length - 1 || inactiveList.length > 0) && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        {anchor.emoji ? (
                          <Text style={styles.emoji}>{anchor.emoji}</Text>
                        ) : null}
                        <Text
                          style={[
                            styles.anchorName,
                            { color: colors.foreground },
                          ]}
                        >
                          {anchor.name}
                        </Text>
                        <Switch
                          value={anchor.active}
                          onValueChange={(v) => handleToggle(anchor, v)}
                          trackColor={{ false: colors.muted, true: colors.primary }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ))}

                    {/* Inactive section divider */}
                    {inactiveList.length > 0 && activeList.length > 0 && (
                      <View
                        style={[
                          styles.dividerRow,
                          { backgroundColor: colors.muted + "40" },
                        ]}
                      >
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>
                          {t.anchors.inactive}
                        </Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                      </View>
                    )}

                    {/* Inactive anchors */}
                    {inactiveList.map((anchor, i) => (
                      <View
                        key={anchor.id}
                        style={[
                          styles.row,
                          styles.rowInactive,
                          i !== inactiveList.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        {anchor.emoji ? (
                          <Text style={[styles.emoji, styles.emojiInactive]}>{anchor.emoji}</Text>
                        ) : null}
                        <Text
                          style={[
                            styles.anchorName,
                            styles.anchorNameInactive,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {anchor.name}
                        </Text>
                        <Switch
                          value={anchor.active}
                          onValueChange={(v) => handleToggle(anchor, v)}
                          trackColor={{ false: colors.muted, true: colors.primary }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/onboarding")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 90,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </Pressable>

      <CreateAnchorSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  header: { marginBottom: 16 },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  createIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  createLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
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
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  groups: { gap: 24 },
  group: { gap: 10 },
  categoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#1C1C1E",
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 8,
  },
  rowInactive: {
    opacity: 0.6,
  },
  emoji: {
    fontSize: 20,
  },
  emojiInactive: {
    opacity: 0.7,
  },
  anchorName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
    marginRight: 4,
  },
  anchorNameInactive: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  fab: {
    position: "absolute",
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
