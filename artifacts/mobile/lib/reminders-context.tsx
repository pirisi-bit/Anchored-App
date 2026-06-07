import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAnchors } from "./anchors-context";
import {
  notificationsSupported,
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "./notifications";

const ENABLED_KEY = "anchored.reminders.enabled";
const HOUR_KEY = "anchored.reminders.hour";
const MINUTE_KEY = "anchored.reminders.minute";

const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

interface RemindersContextType {
  enabled: boolean;
  hour: number;
  minute: number;
  loaded: boolean;
  busy: boolean;
  supported: boolean;
  setEnabled: (next: boolean) => Promise<boolean>;
  setTime: (hour: number, minute: number) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextType | undefined>(
  undefined,
);

function buildBody(remaining: number): string {
  if (remaining <= 0) {
    return "You're all caught up — open Anchored to keep your proof going.";
  }
  if (remaining === 1) {
    return "You have 1 routine left to verify today.";
  }
  return `You have ${remaining} routines left to verify today.`;
}

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { anchors, proofs, todayKey } = useAnchors();
  const [enabled, setEnabledState] = useState(false);
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [minute, setMinute] = useState(DEFAULT_MINUTE);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = notificationsSupported();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedEnabled, storedHour, storedMinute] = await Promise.all([
          AsyncStorage.getItem(ENABLED_KEY),
          AsyncStorage.getItem(HOUR_KEY),
          AsyncStorage.getItem(MINUTE_KEY),
        ]);
        if (!active) return;
        setEnabledState(storedEnabled === "true");
        if (storedHour !== null) setHour(Number(storedHour));
        if (storedMinute !== null) setMinute(Number(storedMinute));
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const remaining = anchors.filter(
    (a) => !proofs.some((p) => p.anchorId === a.id && p.dateKey === todayKey),
  ).length;

  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  const urgentAnchorId =
    anchors.find(
      (a) =>
        a.active &&
        !proofs.some(
          (p) => p.anchorId === a.id && p.dateKey === todayKey,
        ),
    )?.id ?? null;

  const urgentAnchorIdRef = useRef(urgentAnchorId);
  urgentAnchorIdRef.current = urgentAnchorId;

  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (busy) return enabled;
      setBusy(true);
      try {
        if (next) {
          const granted = await requestNotificationPermission();
          if (!granted) {
            return false;
          }
          await scheduleDailyReminder(
            hour,
            minute,
            buildBody(remainingRef.current),
            urgentAnchorIdRef.current,
          );
        } else {
          await cancelDailyReminder();
        }
        setEnabledState(next);
        await AsyncStorage.setItem(ENABLED_KEY, next ? "true" : "false");
        return next;
      } finally {
        setBusy(false);
      }
    },
    [busy, enabled, hour, minute],
  );

  const setTime = useCallback(
    async (nextHour: number, nextMinute: number): Promise<void> => {
      setHour(nextHour);
      setMinute(nextMinute);
      await AsyncStorage.multiSet([
        [HOUR_KEY, String(nextHour)],
        [MINUTE_KEY, String(nextMinute)],
      ]);
      if (enabled) {
        await scheduleDailyReminder(
          nextHour,
          nextMinute,
          buildBody(remainingRef.current),
          urgentAnchorIdRef.current,
        );
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!loaded || !enabled) return;
    scheduleDailyReminder(hour, minute, buildBody(remaining), urgentAnchorId);
  }, [loaded, enabled, hour, minute, remaining, urgentAnchorId]);

  return (
    <RemindersContext.Provider
      value={{
        enabled,
        hour,
        minute,
        loaded,
        busy,
        supported,
        setEnabled,
        setTime,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error("useReminders must be used within a RemindersProvider");
  }
  return context;
}
