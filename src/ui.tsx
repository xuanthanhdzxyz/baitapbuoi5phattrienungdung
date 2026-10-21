import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";

export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && s.danger,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: "#24475a" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Cover({
  uri,
  large = false,
}: {
  uri: string;
  large?: boolean;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return failedUri === uri || !uri ? (
    <View style={[s.cover, large && s.largeCover, s.placeholder]}>
      <Text style={s.muted}>Không tải được ảnh bìa</Text>
    </View>
  ) : (
    <Image
      source={{ uri }}
      accessibilityLabel="Ảnh bìa khóa học"
      style={[s.cover, large && s.largeCover]}
      contentFit="cover"
      transition={200}
      onError={() => setFailedUri(uri)}
    />
  );
}
export function Field({
  label,
  value,
  onChange,
  error,
  numeric = false,
  multiline = false,
  url = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  numeric?: boolean;
  multiline?: boolean;
  url?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={numeric ? "decimal-pad" : url ? "url" : "default"}
        autoCapitalize={url ? "none" : "sentences"}
        autoCorrect={!url}
        style={[
          s.input,
          multiline && { minHeight: 110, textAlignVertical: "top" },
          !!error && { borderColor: "#b93838" },
        ]}
      />
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}
export const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f5f7f8" },
  shell: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
    borderBottomWidth: 1,
    borderColor: "#e1e8ea",
    backgroundColor: "#fff",
  },
  brand: {
    fontWeight: "900",
    fontSize: 20,
    color: "#143846",
    letterSpacing: 1,
  },
  brandDot: { color: "#148579" },
  student: { marginTop: 5, color: "#647b85", fontSize: 12 },
  settings: { color: "#147d73", fontWeight: "700", padding: 8 },
  pageTitle: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 15,
    gap: 7,
  },
  title: { color: "#143846", fontSize: 29, fontWeight: "800" },
  back: { color: "#147d73", fontWeight: "600", marginBottom: 8 },
  muted: { color: "#647680", lineHeight: 21, fontSize: 14 },
  heading: {
    color: "#193e4c",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
  },
  toolbar: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  button: {
    backgroundColor: "#147d73",
    paddingVertical: 13,
    paddingHorizontal: 17,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  secondary: { backgroundColor: "#e5eef0" },
  danger: { backgroundColor: "#b54145" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  filters: { marginHorizontal: 22, marginTop: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#d7e1e6",
    backgroundColor: "#fff",
    color: "#193e4c",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 11,
    fontSize: 16,
    minHeight: 48,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#d7e1e6",
    backgroundColor: "#fff",
    borderRadius: 11,
    overflow: "hidden",
  },
  result: {
    color: "#647680",
    marginHorizontal: 22,
    marginVertical: 14,
    fontSize: 12,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 22, paddingBottom: 24, gap: 18 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e7ea",
  },
  cover: { width: "100%", height: 180, backgroundColor: "#e2e9ec" },
  largeCover: { height: 235, borderRadius: 16 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 18, gap: 8 },
  badge: { color: "#147d73", fontWeight: "700", fontSize: 12, lineHeight: 20 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eef2f3",
  },
  price: { color: "#147d73", fontSize: 21, fontWeight: "800" },
  empty: { padding: 24, gap: 12, alignItems: "center" },
  content: { padding: 22, paddingTop: 4, gap: 17, paddingBottom: 40 },
  detailTitle: {
    color: "#143846",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
  },
  metrics: {
    padding: 20,
    backgroundColor: "#e7f2ef",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  label: { color: "#36515f", fontWeight: "600", fontSize: 13, marginBottom: 7 },
  description: { color: "#405965", fontSize: 16, lineHeight: 25 },
  field: { gap: 2 },
  errorText: { color: "#a73138", lineHeight: 21 },
  errorBox: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: "#fff0ef",
    borderRadius: 12,
    gap: 10,
  },
  notice: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: "#e0f3e9",
    borderRadius: 12,
  },
  noticeText: { color: "#12644b", lineHeight: 20 },
  busy: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    justifyContent: "center",
  },
  panel: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dfe8eb",
    gap: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#112c3baa",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 22,
    gap: 17,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#dfe7e9",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { color: "#788b94", fontSize: 10, letterSpacing: 1 },
  trailer: {
    flex: 1,
    padding: 22,
    gap: 20,
    justifyContent: "center",
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#132e3b",
    borderRadius: 14,
  },
});
