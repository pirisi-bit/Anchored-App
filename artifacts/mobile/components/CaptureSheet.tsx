import { useState } from "react";
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
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { uploadProofFile, type PickedFile } from "@/lib/upload";

export type CaptureMode = "photo" | "receipt";

interface CaptureSheetProps {
  visible: boolean;
  mode: CaptureMode;
  anchorName: string;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

export function CaptureSheet({
  visible,
  mode,
  anchorName,
  onClose,
  onUploaded,
}: CaptureSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setPicked(null);
    setUploading(false);
  };

  const close = () => {
    // Don't allow dismissal mid-upload — the file would land in storage but the
    // proof would never get linked to the anchor.
    if (uploading) return;
    reset();
    onClose();
  };

  const handleImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    setPicked({
      uri: asset.uri,
      name: asset.fileName ?? `proof.${ext}`,
      type: asset.mimeType ?? "image/jpeg",
    });
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera access needed",
        "Enable camera access in Settings to capture proof.",
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) handleImageAsset(res.assets[0]);
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) handleImageAsset(res.assets[0]);
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setPicked({
        uri: a.uri,
        name: a.name ?? "receipt.pdf",
        type: a.mimeType ?? "application/pdf",
        size: a.size ?? undefined,
      });
    }
  };

  const handleUpload = async () => {
    if (!picked) return;
    setUploading(true);
    try {
      const url = await uploadProofFile(picked);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onUploaded(url);
      reset();
    } catch (e) {
      Alert.alert(
        "Upload failed",
        e instanceof Error ? e.message : "Please try again.",
      );
      setUploading(false);
    }
  };

  const isImage = picked?.type.startsWith("image/");
  const title = mode === "receipt" ? "Receipt" : "Proof";

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
            {title}: {anchorName}
          </Text>
          <Pressable onPress={close} hitSlop={10} disabled={uploading}>
            <Feather
              name="x"
              size={22}
              color={uploading ? colors.mutedForeground : colors.foreground}
            />
          </Pressable>
        </View>

        {!picked ? (
          <View style={styles.options}>
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.optionPrimary,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="camera" size={20} color={colors.primaryForeground} />
              <Text
                style={[styles.optionPrimaryText, { color: colors.primaryForeground }]}
              >
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              onPress={pickFromLibrary}
              style={({ pressed }) => [
                styles.option,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="image" size={20} color={colors.foreground} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>
                Choose from Library
              </Text>
            </Pressable>

            {mode === "receipt" ? (
              <Pressable
                onPress={pickDocument}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Feather name="file-text" size={20} color={colors.foreground} />
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  Choose a File (PDF)
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.preview}>
            {isImage ? (
              <Image
                source={{ uri: picked.uri }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.pdfCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.pdfIcon,
                    { backgroundColor: "rgba(255,140,66,0.15)" },
                  ]}
                >
                  <Feather name="file-text" size={24} color={colors.brandOrange} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.pdfName, { color: colors.foreground }]}
                >
                  {picked.name}
                </Text>
              </View>
            )}

            <View style={styles.previewActions}>
              <Pressable
                onPress={() => setPicked(null)}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.option,
                  styles.flex1,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  Retake
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUpload}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.optionPrimary,
                  styles.flex1,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.optionPrimaryText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Use this {mode === "receipt" ? "receipt" : "photo"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
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
  options: {
    gap: 12,
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
  preview: {
    gap: 14,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    maxHeight: 360,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
});
