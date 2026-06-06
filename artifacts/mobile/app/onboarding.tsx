import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { categoryColor, CATEGORY_ORDER, TEMPLATES } from "@/lib/categories";
import type { Anchor, Category, VerificationMethod } from "@/lib/storage";

function defaultMethod(category: Category): VerificationMethod {
  if (category === "Bills & Receipts") return "Receipt";
  return "Self-confirm";
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { anchors, addAnchors } = useAnchors();

  const [expanded, setExpanded] = useState<Category | null>(CATEGORY_ORDER[0]);
  const [selected, setSelected] = useState<Record<string, Category>>({});
  const [saving, setSaving] = useState(false);

  const existingNames = new Set(anchors.map((a) => a.name));

  const toggle = (template: string, category: Category) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[template]) {
        delete next[template];
      } else {
        next[template] = category;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 12;

  const save = async () => {
    const entries = Object.entries(selected).filter(
      ([name]) => !existingNames.has(name),
    );
    if (entries.length === 0) {
      router.back();
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const newAnchors: Anchor[] = entries.map(([name, category]) => ({
      id: Crypto.randomUUID(),
      name,
      category,
      verificationMethod: defaultMethod(category),
      active: true,
      createdAt: now,
    }));
    try {
      await addAnchors(newAnchors);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert("Could not save", "Please try again.");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Pick your anchors
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose the routines you want to prove each day. You can change these
          anytime.
        </Text>

        <View style={styles.groups}>
          {CATEGORY_ORDER.map((category) => {
            const isOpen = expanded === category;
            return (
              <View
                key={category}
                style={[
                  styles.group,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={() => setExpanded(isOpen ? null : category)}
                  style={[
                    styles.groupHeader,
                    { backgroundColor: categoryColor(category, colors) },
                  ]}
                >
                  <Text style={styles.groupHeaderText}>{category}</Text>
                  <Feather
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1C1C1E"
                  />
                </Pressable>

                {isOpen ? (
                  <View style={styles.templates}>
                    {TEMPLATES[category].map((template) => {
                      const checked = !!selected[template];
                      const already = existingNames.has(template);
                      return (
                        <Pressable
                          key={template}
                          onPress={() => !already && toggle(template, category)}
                          style={styles.templateRow}
                          disabled={already}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderColor:
                                  checked || already ? colors.primary : colors.border,
                                backgroundColor:
                                  checked || already ? colors.primary : "transparent",
                              },
                            ]}
                          >
                            {checked || already ? (
                              <Feather name="check" size={14} color={colors.primaryForeground} />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.templateText,
                              {
                                color: already
                                  ? colors.mutedForeground
                                  : colors.foreground,
                              },
                            ]}
                          >
                            {template}
                            {already ? "  (added)" : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed || saving ? 0.9 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {selectedCount > 0
                ? `Add ${selectedCount} anchor${selectedCount > 1 ? "s" : ""}`
                : "Done"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    marginBottom: 24,
  },
  groups: { gap: 14 },
  group: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupHeaderText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1C1C1E",
  },
  templates: {
    padding: 8,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  templateText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
