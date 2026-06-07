import { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { PREDEFINED_CATEGORIES } from "@/lib/storage";

const PREDEFINED_SET = new Set<string>(PREDEFINED_CATEGORIES);

const EMOJIS = [
  "🏠","🔒","🍳","🪟","🚨","🔌",
  "💊","🩺","🧴","🟠","🏥","🩹",
  "🧾","⚡","💡","🌐","💳","🏦",
  "🧼","🪥","🚿","💧","🏃","🧘",
  "💤","🥗","🌿","📱","☀️","🌙",
  "🐾","🐕","🐱","🦴","🐠","🐦",
  "📝","✅","⭐","❤️","🌟","🎯",
];

const COLOR_OPTIONS = [
  { key: "sage",     hex: "#A7C4BC" },
  { key: "sky",      hex: "#A8D8EA" },
  { key: "yellow",   hex: "#F5D77E" },
  { key: "lavender", hex: "#C9B8E8" },
  { key: "orange",   hex: "#F0B07A" },
  { key: "rose",     hex: "#F4A7B9" },
  { key: "slate",    hex: "#94A3B8" },
];

interface CreateAnchorSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAnchorSheet({ visible, onClose }: CreateAnchorSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { addAnchors, anchors } = useAnchors();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [emoji, setEmoji] = useState("📌");
  const [color, setColor] = useState("sage");
  const [saving, setSaving] = useState(false);

  // Derive custom categories from saved anchors — no extra API call needed.
  const derivedCustomCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const anchor of anchors) {
      if (!PREDEFINED_SET.has(anchor.category) && !seen.has(anchor.category)) {
        seen.add(anchor.category);
        result.push(anchor.category);
      }
    }
    return result;
  }, [anchors]);

  // Categories typed in this session before saving.
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");

  const allCategories = [
    ...PREDEFINED_CATEGORIES,
    ...derivedCustomCategories,
    ...pendingCategories.filter(
      (c) => !PREDEFINED_SET.has(c) && !derivedCustomCategories.includes(c)
    ),
  ];

  const reset = () => {
    setName("");
    setCategory("Other");
    setEmoji("📌");
    setColor("sage");
    setSaving(false);
    setPendingCategories([]);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const existing = allCategories.find((c) => c.toLowerCase() === lower);
    if (existing) {
      setCategory(existing);
      setShowNewCat(false);
      setNewCatInput("");
      return;
    }
    setPendingCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t.createAnchor.nameRequired);
      return;
    }
    setSaving(true);
    try {
      await addAnchors([{
        id: Crypto.randomUUID(),
        name: trimmed,
        category,
        verificationMethod: "Photo",
        active: true,
        createdAt: new Date().toISOString(),
        emoji,
        color,
      }]);
      handleClose();
    } catch {
      Alert.alert(t.createAnchor.couldNotSave);
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kvContainer}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {t.createAnchor.title}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.createAnchor.nameLabel}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.createAnchor.namePlaceholder}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                maxLength={60}
                returnKeyType="done"
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.createAnchor.categoryLabel}
              </Text>
              <View style={styles.pills}>
                {allCategories.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      category === cat && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.foreground },
                        category === cat && { color: colors.primaryForeground },
                      ]}
                    >
                      {t.categories[cat] ?? cat}
                    </Text>
                  </Pressable>
                ))}

                {/* "+ New category" */}
                {!showNewCat ? (
                  <Pressable
                    onPress={() => setShowNewCat(true)}
                    style={[
                      styles.pill,
                      styles.pillDashed,
                      { borderColor: colors.mutedForeground },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: colors.mutedForeground }]}>
                      + {t.createAnchor.newCategory}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.newCatRow, { width: "100%" }]}>
                    <TextInput
                      value={newCatInput}
                      onChangeText={setNewCatInput}
                      placeholder={t.createAnchor.newCategoryPlaceholder}
                      placeholderTextColor={colors.mutedForeground}
                      style={[
                        styles.newCatInput,
                        {
                          flex: 1,
                          backgroundColor: colors.muted,
                          color: colors.foreground,
                          borderColor: colors.border,
                        },
                      ]}
                      maxLength={30}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAddCategory}
                    />
                    <Pressable
                      onPress={handleAddCategory}
                      disabled={!newCatInput.trim()}
                      style={[
                        styles.addCatBtn,
                        { backgroundColor: colors.primary },
                        !newCatInput.trim() && { opacity: 0.5 },
                      ]}
                    >
                      <Text style={[styles.addCatText, { color: colors.primaryForeground }]}>
                        {t.createAnchor.addCategory}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setShowNewCat(false); setNewCatInput(""); }}
                      hitSlop={8}
                    >
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Emoji */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.createAnchor.emojiLabel}
              </Text>
              <View style={styles.emojiGrid}>
                {EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[
                      styles.emojiBtn,
                      { backgroundColor: colors.background },
                      emoji === e && {
                        backgroundColor: colors.primary + "22",
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.createAnchor.colorLabel}
              </Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((c) => (
                  <Pressable
                    key={c.key}
                    onPress={() => setColor(c.key)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.hex },
                      color === c.key && {
                        borderWidth: 3,
                        borderColor: colors.foreground,
                        transform: [{ scale: 1.15 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary, marginTop: 16 },
              saving && { opacity: 0.7 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                {t.createAnchor.save}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  kvContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillDashed: {
    borderStyle: "dashed",
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  newCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  newCatInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addCatBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  addCatText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  saveBtn: {
    height: 52,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
