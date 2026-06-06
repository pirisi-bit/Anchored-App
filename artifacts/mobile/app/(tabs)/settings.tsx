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
      Alert.alert(
        "Not available here",
        "Daily reminders work in the Anchored mobile app.",
      );
      return;
    }
    const result = await setEnabled(next);
    if (next && !result) {
      Alert.alert(
        "Notifications are off",
        "Enable notifications for Anchored in your device Settings to get daily reminders.",
      );
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
      "Are you absolutely sure?",
      "This permanently deletes all of your anchors and proofs. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAll();
            } catch {
              Alert.alert("Could not clear data", "Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert("Could not sign out", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

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
              My Account
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.profileEmail, { color: colors.mutedForeground }]}
            >
              {user?.email ?? "Signed in"}
            </Text>
          </View>
        </View>

        <SectionLabel>ANCHORS</SectionLabel>
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
              Add more anchors
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <SectionLabel>REMINDERS</SectionLabel>
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
                  Daily reminder
                </Text>
                <Text
                  style={[styles.reminderSub, { color: colors.mutedForeground }]}
                >
                  Nudge me to verify my routines
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
                Reminder time
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
              Reminders are available in the Anchored mobile app.
            </Text>
          )}
        </View>

        <SectionLabel>DATA</SectionLabel>
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
              Clear all data
            </Text>
          </View>
        </Pressable>

        <SectionLabel>ACCOUNT</SectionLabel>
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
              Sign out
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Anchored v1.0
          </Text>
          <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>
            Synced securely to your account.
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
