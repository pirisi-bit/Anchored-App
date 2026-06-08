import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const REMINDER_IDENTIFIER = "donemark-daily-reminder";
export const REMINDER_NOTIFICATION_TYPE = "daily-reminder";

export function isDailyReminderResponse(
  response: Notifications.NotificationResponse | null | undefined,
): boolean {
  const data =
    response?.notification?.request?.content?.data ?? undefined;
  return data?.type === REMINDER_NOTIFICATION_TYPE;
}

export function getReminderAnchorId(
  response: Notifications.NotificationResponse | null | undefined,
): string | null {
  const data =
    response?.notification?.request?.content?.data ?? undefined;
  if (data?.type !== REMINDER_NOTIFICATION_TYPE) return null;
  const anchorId = data?.anchorId;
  return typeof anchorId === "string" && anchorId.length > 0 ? anchorId : null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function notificationsSupported(): boolean {
  return Platform.OS !== "web";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelDailyReminder(): Promise<void> {
  if (!notificationsSupported()) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(
    () => {},
  );
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  body: string,
  anchorId?: string | null,
): Promise<void> {
  if (!notificationsSupported()) return;
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: "Time to mark what's done",
      body,
      data: {
        type: REMINDER_NOTIFICATION_TYPE,
        ...(anchorId ? { anchorId } : {}),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
