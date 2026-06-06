import { useMemo } from "react";
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
import { categoryColor, CATEGORY_ORDER } from "@/lib/categories";
import type { Anchor, Category } from "@/lib/storage";

export default function AnchorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { anchors, loading, updateAnchorState } = useAnchors();

  const grouped = useMemo(() => {
    const map = new Map<Category, Anchor[]>();
    for (const anchor of anchors) {
      const list = map.get(anchor.category) ?? [];
      list.push(anchor);
      map.set(anchor.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [anchors]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 8;

  const handleToggle = async (anchor: Anchor, active: boolean) => {
    try {
      await updateAnchorState({ ...anchor, active });
    } catch {
      Alert.alert("Could not update", "Please try again.");
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
            Manage Anchors
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enable or disable your tracked habits.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : anchors.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              You haven't set up any anchors yet.
            </Text>
          </View>
        ) : (
          <View style={styles.groups}>
            {grouped.map(([category, list]) => (
              <View key={category} style={styles.group}>
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: categoryColor(category, colors) },
                  ]}
                >
                  <Text style={styles.categoryChipText}>{category}</Text>
                </View>
                <View
                  style={[
                    styles.groupCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {list.map((anchor, i) => (
                    <View
                      key={anchor.id}
                      style={[
                        styles.row,
                        i !== list.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.anchorName,
                          {
                            color: anchor.active
                              ? colors.foreground
                              : colors.mutedForeground,
                            textDecorationLine: anchor.active
                              ? "none"
                              : "line-through",
                          },
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
            ))}
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
  },
  anchorName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
    marginRight: 12,
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
