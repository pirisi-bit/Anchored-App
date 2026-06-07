import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AnchorsProvider, useAnchors } from "@/lib/anchors-context";
import { RemindersProvider } from "@/lib/reminders-context";
import {
  getReminderAnchorId,
  isDailyReminderResponse,
  notificationsSupported,
} from "@/lib/notifications";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function LoadingScreen() {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { anchors, proofs, todayKey, loading: anchorsLoading } = useAnchors();
  const segments = useSegments();
  const router = useRouter();
  const handledColdStartResponse = useRef(false);
  const [pendingResponse, setPendingResponse] =
    useState<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    if (loading) return;
    const inAuthScreen = segments[0] === "login";
    if (!user && !inAuthScreen) {
      router.replace("/login");
    } else if (user && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (!notificationsSupported()) return;
    if (loading || !user) return;

    if (!handledColdStartResponse.current) {
      handledColdStartResponse.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) setPendingResponse(response);
        })
        .catch(() => {});
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => setPendingResponse(response),
    );
    return () => subscription.remove();
  }, [user, loading]);

  const routeFromReminder = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!isDailyReminderResponse(response)) return;
      const anchorId = getReminderAnchorId(response);
      const stillOutstanding =
        !!anchorId &&
        anchors.some(
          (a) =>
            a.id === anchorId &&
            a.active &&
            !proofs.some(
              (p) => p.anchorId === anchorId && p.dateKey === todayKey,
            ),
        );
      if (stillOutstanding) {
        router.replace({
          pathname: "/(tabs)",
          params: { focusAnchor: anchorId, focusKey: String(Date.now()) },
        });
      } else {
        router.replace("/(tabs)");
      }
    },
    [anchors, proofs, todayKey, router],
  );

  useEffect(() => {
    if (!pendingResponse) return;
    if (loading || !user || anchorsLoading) return;
    routeFromReminder(pendingResponse);
    setPendingResponse(null);
  }, [pendingResponse, loading, user, anchorsLoading, routeFromReminder]);

  if (loading) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" options={{ presentation: "modal" }} />
      <Stack.Screen name="proof/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      colorScheme === "dark" ? "#111111" : "#F5F3EF",
    );
  }, [colorScheme]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <AnchorsProvider>
                  <RemindersProvider>
                    <RootLayoutNav />
                  </RemindersProvider>
                </AnchorsProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
