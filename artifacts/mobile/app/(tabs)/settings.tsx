import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Switch,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { useAuth } from "@/lib/auth-context";
import { useReminders } from "@/lib/reminders-context";
import { useLang, useT, type Lang } from "@/lib/lang-context";

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useLang();
  const { clearAll } = useAnchors();
  const { user, signOut } = useAuth();
  const {
    enabled,
    hour,
    minute,
    busy,
    supported,
    setEnabled,
    setTime,
  } = useReminders();
  const [showPicker, setShowPicker] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 8;

  const handleToggleReminders = async (next: boolean) => {
    if (!supported) {
      Alert.alert(t.settings.notAvailableHere, t.settings.notAvailableHereMsg);
      return;
    }
    const result = await setEnabled(next);
    if (next && !result) {
      Alert.alert(t.settings.notificationsOff, t.settings.notificationsOffMsg);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") {
      setShowPicker(false);
    }
    if (event.type === "dismissed" || !date) return;
    setTime(date.getHours(), date.getMinutes());
  };

  const pickerValue = (() => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  })();

  const handleClearAll = () => {
    Alert.alert(
      t.settings.clearDialog.title,
      t.settings.clearDialog.message,
      [
        { text: t.settings.clearDialog.cancel, style: "cancel" },
        {
          text: t.settings.clearDialog.confirm,
          style: "destructive",
          onPress: async () => {
            try {
              await clearAll();
            } catch {
              Alert.alert(t.settings.clearDialog.couldNotClear, t.anchors.tryAgain);
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(t.settings.signOutDialog.title, t.settings.signOutDialog.message, [
      { text: t.settings.signOutDialog.cancel, style: "cancel" },
      {
        text: t.settings.signOutDialog.confirm,
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert(t.settings.signOutDialog.couldNotSignOut, "Please try again.");
          }
        },
      },
    ]);
  };

  const LANGS: { key: Lang; label: string }[] = [
    { key: "en", label: "🇺🇸 English" },
    { key: "es", label: "🇨🇱 Español" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{t.settings.title}</Text>

        <View
          style={[
            styles.profile,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: "rgba(59,130,246,0.08)" }]}
          >
            <Feather name="user" size={26} color={colors.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.profileTitle, { color: colors.foreground }]}>
              {t.settings.myAccount}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.profileEmail, { color: colors.mutedForeground }]}
            >
              {user?.email ?? t.settings.signedIn}
            </Text>
          </View>
        </View>

        <SectionLabel>{t.settings.languageSection}</SectionLabel>
        <View
          style={[
            styles.langCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
            <Feather name="globe" size={20} color={colors.primary} />
          </View>
          <View style={styles.langBtns}>
            {LANGS.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setLang(key)}
                style={({ pressed }) => [
                  styles.langBtn,
                  {
                    backgroundColor: lang === key ? colors.primary : colors.muted,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                testID={`btn-lang-${key}`}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    { color: lang === key ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <SectionLabel>{t.settings.anchorsSection}</SectionLabel>
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
              <Feather name="plus" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: colors.foreground }]}>
              {t.settings.addMore}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <SectionLabel>{t.settings.remindersSection}</SectionLabel>
        <View
          style={[
            styles.reminderCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.reminderRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
                <Feather name="bell" size={20} color={colors.primary} />
              </View>
              <View style={styles.reminderTextWrap}>
                <Text style={[styles.rowText, { color: colors.foreground }]}>
                  {t.settings.dailyReminder}
                </Text>
                <Text
                  style={[styles.reminderSub, { color: colors.mutedForeground }]}
                >
                  {t.settings.dailyReminderSub}
                </Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleReminders}
              disabled={busy || !supported}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor="#FFFFFF"
              testID="switch-daily-reminder"
            />
          </View>

          {enabled && supported && (
            <Pressable
              onPress={() => setShowPicker((s) => !s)}
              style={({ pressed }) => [
                styles.reminderTimeRow,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              testID="btn-reminder-time"
            >
              <Text style={[styles.rowText, { color: colors.foreground }]}>
                {t.settings.reminderTime}
              </Text>
              <View style={styles.reminderTimeRight}>
                <Text style={[styles.reminderTimeValue, { color: colors.primary }]}>
                  {formatTime(hour, minute)}
                </Text>
                <Feather name="clock" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}

          {enabled && supported && showPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                themeVariant={colors.background === "#111111" ? "dark" : "light"}
              />
            </View>
          )}

          {!supported && (
            <Text style={[styles.reminderSub, { color: colors.mutedForeground, marginTop: 12 }]}>
              {t.settings.remindersUnavailable}
            </Text>
          )}
        </View>

        <SectionLabel>{t.settings.dataSection}</SectionLabel>
        <Pressable
          onPress={handleClearAll}
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: "rgba(255,107,107,0.12)" }]}>
              <Feather name="trash-2" size={20} color={colors.destructive} />
            </View>
            <Text style={[styles.rowText, { color: colors.destructive }]}>
              {t.settings.clearAll}
            </Text>
          </View>
        </Pressable>

        <SectionLabel>{t.settings.accountSection}</SectionLabel>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="log-out" size={20} color={colors.foreground} />
            </View>
            <Text style={[styles.rowText, { color: colors.foreground }]}>
              {t.settings.signOut}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {t.settings.version}
          </Text>
          <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>
            {t.settings.synced}
          </Text>
        </View>
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
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { flex: 1, minWidth: 0 },
  profileTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  langBtns: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: "center",
  },
  langBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  reminderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderTextWrap: {
    flexShrink: 1,
  },
  reminderSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  reminderTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
  },
  reminderTimeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderTimeValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  pickerWrap: {
    marginTop: 8,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  footerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
