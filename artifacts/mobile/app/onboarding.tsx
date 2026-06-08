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
import { useT } from "@/lib/lang-context";
import { categoryColor, CATEGORY_ORDER, TEMPLATES } from "@/lib/categories";
import type { Anchor, Category, VerificationMethod } from "@/lib/storage";
import { CreateAnchorSheet } from "@/components/CreateAnchorSheet";

function defaultMethod(category: Category): VerificationMethod {
  if (category === "Bills & Receipts") return "Receipt";
  return "Self-confirm";
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { anchors, addAnchors } = useAnchors();

  // Only show categories that have templates
  const availableCategories = CATEGORY_ORDER.filter(
    (c) => TEMPLATES[c] && TEMPLATES[c].length > 0,
  );

  const [expanded, setExpanded] = useState<Category | null>(availableCategories[0] ?? null);
  const [selected, setSelected] = useState<Record<string, Category>>({});
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Dedup: names already in the user's marks (lowercased for comparison)
  const existingNames = new Set(anchors.map((a) => a.name.toLowerCase()));

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
    // Map template keys to translated labels
    const entries = Object.entries(selected).filter(([key]) => {
      return !existingNames.has(key.toLowerCase());
    });
    if (entries.length === 0) {
      router.back();
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const newAnchors: Anchor[] = entries.map(([key, category]) => ({
      id: Crypto.randomUUID(),
      name: key,
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
      Alert.alert(t.onboarding.couldNotSave, t.onboarding.tryAgain);
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
          {t.onboarding.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t.onboarding.subtitle}
        </Text>

        <View style={styles.groups}>
          {availableCategories.map((category) => {
            const isOpen = expanded === category;
            const categoryLabel = t.categories[category] ?? category;
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
                  <Text style={styles.groupHeaderText}>{categoryLabel}</Text>
                  <Feather
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1C1C1E"
                  />
                </Pressable>

                {isOpen ? (
                  <View style={styles.templates}>
                    {TEMPLATES[category].map((key) => {
                      const label = t.templateNames[key] ?? key;
                      const checked = !!selected[key];
                      const already = existingNames.has(label.toLowerCase());
                      return (
                        <Pressable
                          key={key}
                          onPress={() => !already && toggle(key, category)}
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
                            {label}
                            {already ? `  ${t.onboarding.alreadyAdded}` : ""}
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

        {/* Create your own mark — appears after the template categories */}
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
          <View style={styles.createText}>
            <Text style={[styles.createLabel, { color: colors.foreground }]}>
              {t.onboarding.createOwn}
            </Text>
            <Text style={[styles.createSub, { color: colors.mutedForeground }]}>
              {t.onboarding.createOwnSub}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
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
              {t.onboarding.addBtn(selectedCount)}
            </Text>
          )}
        </Pressable>
      </View>

      <CreateAnchorSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
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
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  createIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: {
    flex: 1,
    gap: 2,
  },
  createLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  createSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
