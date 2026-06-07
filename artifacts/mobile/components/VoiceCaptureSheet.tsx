import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/lang-context";
import { uploadProofFile } from "@/lib/upload";

const MAX_SECONDS = 15;

interface VoiceCaptureSheetProps {
  visible: boolean;
  anchorName: string;
  onClose: () => void;
  onUploaded: (url: string) => void | Promise<void>;
}

export function VoiceCaptureSheet({
  visible,
  anchorName,
  onClose,
  onUploaded,
}: VoiceCaptureSheetProps) {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const player = useAudioPlayer(recordedUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);

  const stoppingRef = useRef(false);

  const isRecording = recorderState.isRecording;
  const elapsed = Math.floor(recorderState.durationMillis / 1000);
  const remaining = Math.max(0, MAX_SECONDS - elapsed);

  const reset = () => {
    setRecordedUri(null);
    setUploading(false);
    stoppingRef.current = false;
  };

  const stopRecording = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      await recorder.stop();
      if (recorder.uri) setRecordedUri(recorder.uri);
    } catch {
      // ignore stop errors — the URI may still be available
      if (recorder.uri) setRecordedUri(recorder.uri);
    } finally {
      stoppingRef.current = false;
    }
  };

  // Auto-stop at the 15s cap.
  useEffect(() => {
    if (isRecording && recorderState.durationMillis >= MAX_SECONDS * 1000) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, recorderState.durationMillis]);

  const close = () => {
    if (uploading) return;
    if (isRecording) {
      recorder.stop().catch(() => {});
    }
    if (playerStatus.playing) player.pause();
    reset();
    onClose();
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t.voice.title, t.voice.micDenied);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setRecordedUri(null);
      await recorder.prepareToRecordAsync();
      recorder.record();
      if (Platform.OS !== "web") Haptics.selectionAsync();
    } catch {
      Alert.alert(t.voice.title, t.voice.recordFailed);
    }
  };

  const togglePlay = () => {
    if (!recordedUri) return;
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  const handleUpload = async () => {
    if (!recordedUri) return;
    setUploading(true);
    try {
      const url = await uploadProofFile({
        uri: recordedUri,
        name: "voice.m4a",
        type: "audio/m4a",
      });
      await onUploaded(url);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      reset();
    } catch (e) {
      Alert.alert(
        t.voice.uploadFailed,
        e instanceof Error ? e.message : t.onboarding.tryAgain,
      );
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 20,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.voice.title}: {anchorName}
          </Text>
          <Pressable onPress={close} hitSlop={10} disabled={uploading}>
            <Feather
              name="x"
              size={22}
              color={uploading ? colors.mutedForeground : colors.foreground}
            />
          </Pressable>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t.voice.subtitle}
        </Text>

        <View style={styles.stage}>
          <Text style={[styles.timer, { color: colors.foreground }]}>
            {isRecording
              ? `0:${String(remaining).padStart(2, "0")}`
              : recordedUri
                ? `0:${String(Math.min(elapsed, MAX_SECONDS)).padStart(2, "0")}`
                : `0:${String(MAX_SECONDS).padStart(2, "0")}`}
          </Text>
          <Text style={[styles.stageHint, { color: colors.mutedForeground }]}>
            {isRecording
              ? t.voice.recordingHint
              : recordedUri
                ? ""
                : t.voice.maxHint(MAX_SECONDS)}
          </Text>
        </View>

        {!recordedUri ? (
          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            style={({ pressed }) => [
              styles.recordBtn,
              {
                backgroundColor: isRecording ? colors.brandOrange : colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather
              name={isRecording ? "square" : "mic"}
              size={20}
              color={colors.primaryForeground}
            />
            <Text style={[styles.recordBtnText, { color: colors.primaryForeground }]}>
              {isRecording ? t.voice.stop : t.voice.startRecording}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.reviewActions}>
            <Pressable
              onPress={togglePlay}
              disabled={uploading}
              style={({ pressed }) => [
                styles.option,
                styles.flex1,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather
                name={playerStatus.playing ? "pause" : "play"}
                size={18}
                color={colors.foreground}
              />
              <Text style={[styles.optionText, { color: colors.foreground }]}>
                {t.voice.play}
              </Text>
            </Pressable>
            <Pressable
              onPress={startRecording}
              disabled={uploading}
              style={({ pressed }) => [
                styles.option,
                styles.flex1,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather name="refresh-ccw" size={18} color={colors.foreground} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>
                {t.voice.reRecord}
              </Text>
            </Pressable>
          </View>
        )}

        {recordedUri ? (
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            style={({ pressed }) => [
              styles.optionPrimary,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[styles.optionPrimaryText, { color: colors.primaryForeground }]}
              >
                {t.voice.useRecording}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(120,120,120,0.35)",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  stage: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  timer: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  stageHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    minHeight: 18,
  },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: 18,
  },
  recordBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  reviewActions: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  optionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: 18,
  },
  optionPrimaryText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  flex1: {
    flex: 1,
  },
});
