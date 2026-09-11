// Bug report (PLAN.md D21): a message, an optional email, and the context
// the app can gather itself. Posts to the backend, which stores and emails
// it; when Sentry is on, the report cites the event that carries device,
// route and recent breadcrumbs.

import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureMessage, sentryEnabled, track } from "../src/observability";
import { apiBase } from "../src/sources/client";
import { sendBugReport, type BugReportResult } from "../src/sources/bugReport";

function gatherContext(): Record<string, string> {
  const ctx: Record<string, string> = {
    platform: Platform.OS,
    version: Constants.expoConfig?.version ?? "dev",
    sentAt: new Date().toISOString(),
  };
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    ctx.userAgent = navigator.userAgent;
    ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
  }
  return ctx;
}

export default function Bug() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | BugReportResult>(
    "idle",
  );
  const serverConfigured = apiBase() !== null;

  const submit = async () => {
    if (!message.trim()) return;
    setState("sending");
    const context = gatherContext();
    const sentryEventId =
      captureMessage("Bug report", { ...context, message }) ?? undefined;
    const result = await sendBugReport({
      message: message.trim(),
      email: email.trim() || undefined,
      context,
      sentryEventId,
    });
    track("bug_report_sent", { ok: result.ok });
    setState(result);
  };

  const done = state !== "idle" && state !== "sending" && state.ok;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Report a bug</Text>

        {done ? (
          <View>
            <Text style={styles.body}>
              Thanks. It is with the team. If you left an email we will reply
              there.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.body}>
              What happened, and what did you expect? Your platform, app version
              and the screen you were on are attached automatically.
            </Text>
            <TextInput
              accessibilityLabel="What happened"
              multiline
              placeholder="The laundry tile says…"
              placeholderTextColor="#999999"
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.multiline]}
            />
            <TextInput
              accessibilityLabel="Email, optional"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email, if you want a reply (optional)"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            {!serverConfigured ? (
              <Text style={styles.warn}>
                This build has no server configured, so reports cannot be sent
                yet. Open an issue on GitHub instead.
              </Text>
            ) : null}
            {state !== "idle" && state !== "sending" && !state.ok ? (
              <Text style={styles.warn}>
                {state.reason === "rejected"
                  ? `The server did not accept it: ${state.detail ?? "unknown reason"}.`
                  : state.reason === "network"
                    ? "Could not reach the server. Check your connection and try again."
                    : "No server is configured in this build."}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={
                state === "sending" || !message.trim() || !serverConfigured
              }
              onPress={submit}
              style={({ pressed }) => [
                styles.send,
                (state === "sending" || !message.trim() || !serverConfigured) &&
                  styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sendText}>
                {state === "sending" ? "Sending…" : "Send"}
              </Text>
            </Pressable>
            <Text style={styles.fine}>
              {sentryEnabled
                ? "Device details and recent screens are attached through Sentry."
                : "No crash reporting is active in this build."}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    paddingHorizontal: 20,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  back: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 8,
  },
  backText: { fontSize: 16, color: "#555555" },
  pressed: { opacity: 0.8 },
  title: { fontSize: 32, fontWeight: "800", color: "#111111", marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 23, color: "#333333", marginBottom: 16 },
  input: {
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111111",
    marginBottom: 12,
  },
  multiline: { minHeight: 140, textAlignVertical: "top" },
  warn: { color: "#b23a3a", marginBottom: 12, lineHeight: 20 },
  send: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  sendText: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  fine: { marginTop: 14, fontSize: 13, color: "#777777" },
});
