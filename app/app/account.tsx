// Account (PLAN.md D20): sign in with a brandeis.edu email to keep your
// tiles and settings across devices. Nothing else is stored.

import { useState } from "react";
import { Linking, StyleSheet, TextInput, View } from "react-native";
import { useAccount } from "../src/account/AccountProvider";
import { Button, H, P, Page, pageStyles } from "../src/chrome/Page";
import { apiBase } from "../src/sources/client";
import { Text } from "../src/ui/Text";
import { colors, space, type } from "../src/ui/theme";

export default function Account() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const serverConfigured = apiBase() !== null;

  const send = async () => {
    setState("sending");
    setError(null);
    const r = await account.requestLink(email.trim());
    if (r.ok) {
      setState("sent");
      setDevLink(r.link ?? null);
    } else {
      setState("error");
      setError(r.error);
    }
  };

  if (account.status === "in") {
    return (
      <Page title="Account">
        <P>
          Signed in as <Text style={styles.strong}>{account.email}</Text>.
        </P>
        <P>
          Your tiles, their order and colours, the venues you follow, your
          laundry building and shuttle stop follow you to any device you sign in
          on.
          {account.syncing ? " Saving…" : ""}
        </P>
        <View style={{ marginTop: space.md }}>
          <Button label="Sign out" onPress={() => void account.signOut()} />
        </View>
      </Page>
    );
  }

  return (
    <Page title="Account">
      <P>
        Sign in with your Brandeis email to keep your home screen the same on
        every device. We email you a link; there is no password. Only your
        layout and settings are stored.
      </P>
      {state === "sent" ? (
        <View>
          <H>Check your email</H>
          <P>
            We sent a sign-in link to {email.trim().toLowerCase()}. It works
            once and expires in 20 minutes. Open it on this device.
          </P>
          {devLink ? (
            <Text
              accessibilityRole="link"
              style={styles.devLink}
              onPress={() => Linking.openURL(devLink).catch(() => {})}
            >
              Development: open the link now
            </Text>
          ) : null}
          <View style={{ marginTop: space.md }}>
            <Button
              label="Use a different email"
              onPress={() => setState("idle")}
            />
          </View>
        </View>
      ) : (
        <View>
          <TextInput
            accessibilityLabel="Brandeis email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@brandeis.edu"
            placeholderTextColor={colors.faint}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={send}
            style={pageStyles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!serverConfigured ? (
            <Text style={styles.error}>
              This build has no server configured, so sign-in is off.
            </Text>
          ) : null}
          <Button
            label={state === "sending" ? "Sending…" : "Email me a sign-in link"}
            onPress={send}
            disabled={
              state === "sending" || !email.includes("@") || !serverConfigured
            }
          />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: "600" },
  error: { ...type.small, color: colors.danger, marginBottom: space.md },
  devLink: {
    ...type.body,
    color: colors.accent,
    textDecorationLine: "underline",
    marginBottom: space.md,
  },
});
