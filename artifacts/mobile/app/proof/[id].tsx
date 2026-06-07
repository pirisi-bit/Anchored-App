import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useColors } from "@/hooks/useColors";
import { useAnchors } from "@/lib/anchors-context";
import { useT } from "@/lib/lang-context";
import { categoryColor } from "@/lib/categories";
import { StatusBadge } from "@/components/StatusBadge";

function isPdfUrl(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${date} · ${h}:${m} ${ampm}`;
}

export default function ProofReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { proofs, anchors, loading } = useAnchors();
  const t = useT();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 12;

  const proof = proofs.find((p) => p.id === id);
  const anchor = proof ? anchors.find((a) => a.id === proof.anchorId) : undefined;

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/proof");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!proof || !anchor) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Pressable onPress={back} style={styles.backRow} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.foreground }]}>
            Proof not found.
          </Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            It may have been cleared or doesn't exist.
          </Text>
        </View>
      </View>
    );
  }

  const isSelfConfirmed = proof.status === "Self-confirmed";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={back} style={styles.backRow} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>

        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
          PROOF REVIEW
        </Text>
        <View style={styles.titleRow}>
          <View
            style={[styles.dot, { backgroundColor: categoryColor(anchor.category, colors) }]}
          />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.templateNames[anchor.name] ?? anchor.name}
          </Text>
        </View>

        {isSelfConfirmed ? (
          <View style={[styles.warning, { backgroundColor: "rgba(255,217,61,0.15)", borderColor: "rgba(255,217,61,0.5)" }]}>
            <Feather name="alert-triangle" size={18} color="#B45309" />
            <View style={styles.flex1}>
              <Text style={styles.warningTitle}>Self-confirmed</Text>
              <Text style={styles.warningText}>
                This item was self-confirmed without evidence.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow label="Anchor" value={t.templateNames[anchor.name] ?? anchor.name} />
          <DetailRow label="Category" value={anchor.category} />
          <DetailRow label="Status" value={<StatusBadge status={proof.status} />} />
          <DetailRow label="Method" value={proof.verificationMethod} />
          <DetailRow label="Timestamp" value={formatTimestamp(proof.createdAt)} last />
        </View>

        {proof.photoUrl ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="camera" size={16} color={colors.mutedForeground} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Photo</Text>
            </View>
            <Image
              source={{ uri: proof.photoUrl }}
              style={[styles.media, { backgroundColor: colors.muted }]}
              contentFit="cover"
            />
          </View>
        ) : null}

        {proof.receiptUrl ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={16} color={colors.mutedForeground} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Receipt</Text>
            </View>
            {isPdfUrl(proof.receiptUrl) ? (
              <Pressable
                onPress={() => Linking.openURL(proof.receiptUrl!)}
                style={[styles.pdfCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="file-text" size={24} color={colors.brandOrange} />
                <Text style={[styles.pdfText, { color: colors.primary }]}>Open PDF</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => Linking.openURL(proof.receiptUrl!)}>
                <Image
                  source={{ uri: proof.receiptUrl }}
                  style={[styles.media, { backgroundColor: colors.muted }]}
                  contentFit="cover"
                />
              </Pressable>
            )}
          </View>
        ) : null}

        {proof.voiceUrl ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="mic" size={16} color={colors.mutedForeground} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice note</Text>
            </View>
            <VoicePlayer uri={proof.voiceUrl} />
          </View>
        ) : null}

        <Pressable
          onPress={back}
          style={({ pressed }) => [
            styles.doneBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.doneText, { color: colors.foreground }]}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function VoicePlayer({ uri }: { uri: string }) {
  const colors = useColors();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= status.duration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.voiceCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.voiceIcon, { backgroundColor: colors.primary }]}>
        <Feather
          name={status.playing ? "pause" : "play"}
          size={20}
          color={colors.primaryForeground}
        />
      </View>
      <Text style={[styles.voiceText, { color: colors.foreground }]}>
        {status.playing ? "Playing…" : "Play voice note"}
      </Text>
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {typeof value === "string" ? (
        <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
  content: {
    paddingHorizontal: 20,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 16,
    marginLeft: -4,
  },
  backText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    flex: 1,
  },
  warning: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#92400E",
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#92400E",
    marginTop: 2,
  },
  flex1: { flex: 1 },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
    textAlign: "right",
  },
  section: { marginBottom: 22, gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  media: {
    width: "100%",
    borderRadius: 18,
    aspectRatio: 3 / 4,
    maxHeight: 460,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
    borderRadius: 18,
    borderWidth: 1,
  },
  pdfText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  voiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  doneBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  doneText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  notFound: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  notFoundSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
