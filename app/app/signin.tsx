// Where a magic link lands (PLAN.md D20): /signin?token=… verifies the
// token, opens the session, and returns home.

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useAccount } from "../src/account/AccountProvider";
import { Button, P, Page } from "../src/chrome/Page";
import { space } from "../src/ui/theme";

export default function SignIn() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const account = useAccount();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || done) return;
    let cancelled = false;
    account.verify(token).then((err) => {
      if (cancelled) return;
      if (err) setError(err);
      else {
        setDone(true);
        router.replace("/");
      }
    });
    return () => {
      cancelled = true;
    };
    // Verify once per token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Page title="Signing in">
      {!token ? (
        <P>
          This link is missing its token. Ask for a new one from the Account
          page.
        </P>
      ) : error ? (
        <P>{error}</P>
      ) : (
        <P>One moment…</P>
      )}
      {!token || error ? (
        <View style={{ marginTop: space.md }}>
          <Button
            label="Go to Account"
            onPress={() => router.replace("/account")}
          />
        </View>
      ) : null}
    </Page>
  );
}
