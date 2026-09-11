// Search (PLAN.md D15): loose fuzzy matching over one local fixture, three
// action kinds, a chip row of quick links above the keyboard. Any URL
// result can be promoted to a link tile from here (D12).

import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "../src/preferences/store";
import {
  CHIPS,
  ENTRIES,
  ENTRY_BY_ID,
  type SearchEntry,
} from "../src/search/entries";
import { search } from "../src/search/match";
import { linkTileId } from "../src/tiles/registry";

const ONESEARCH = ENTRY_BY_ID.get("onesearch");

function hostOf(url: string): string {
  try {
    return new URL(url.replace("{query}", "")).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePreferences();
  const [query, setQuery] = useState("");
  const promoted = new Set(prefs.promoted);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return ENTRIES;
    const hits = search(q, ENTRIES, (e) => [
      e.title,
      e.subtitle,
      ...e.keywords,
    ]);
    // OneSearch takes any query, so it is always the last resort.
    if (ONESEARCH && !hits.includes(ONESEARCH)) hits.push(ONESEARCH);
    return hits;
  }, [query]);

  const close = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const run = (entry: SearchEntry) => {
    const a = entry.action;
    if (a.kind === "url") {
      const url = a.url.replace("{query}", encodeURIComponent(query.trim()));
      Linking.openURL(url).catch(() => {});
      return;
    }
    const href = a.kind === "route" ? a.route : `/${a.tile}`;
    // Leave search behind and go straight to the destination.
    if (router.canGoBack()) router.dismissTo(href);
    else router.replace(href);
  };

  const togglePromoted = (entry: SearchEntry) => {
    update((p) =>
      p.promoted.includes(entry.id)
        ? { promoted: p.promoted.filter((x) => x !== entry.id) }
        : {
            promoted: [...p.promoted, entry.id],
            hidden: p.hidden.filter((h) => h !== linkTileId(entry.id)),
          },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <TextInput
          accessibilityLabel="Search"
          autoFocus
          autoCorrect={false}
          placeholder="Search Dice"
          placeholderTextColor="#999999"
          returnKeyType="search"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => results[0] && run(results[0])}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
      >
        {results.map((e) => {
          const isUrl = e.action.kind === "url";
          const isOneSearchFallback =
            e === ONESEARCH && query.trim().length > 0;
          const subtitle = isOneSearchFallback
            ? `Search the library for “${query.trim()}”`
            : isUrl
              ? `Opens ${hostOf(e.action.kind === "url" ? e.action.url : "")}`
              : e.subtitle;
          return (
            <View key={e.id} style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={e.title}
                onPress={() => run(e)}
                style={({ pressed }) => [
                  styles.rowMain,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.icon}>{e.icon}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{e.title}</Text>
                  <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
              </Pressable>
              {isUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    promoted.has(e.id)
                      ? `Remove ${e.title} tile`
                      : `Add ${e.title} tile`
                  }
                  onPress={() => togglePromoted(e)}
                  style={({ pressed }) => [
                    styles.pin,
                    promoted.has(e.id) && styles.pinOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.pinText,
                      promoted.has(e.id) && styles.pinTextOn,
                    ]}
                  >
                    {promoted.has(e.id) ? "On grid" : "Add tile"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {results.length === 0 ? (
          <Text style={styles.empty}>Nothing matches. Try another word.</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.chipBar, { paddingBottom: insets.bottom + 10 }]}>
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CHIPS.map((e) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.title}
              onPress={() => run(e)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>
                {e.icon} {e.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 18,
    fontSize: 17,
    color: "#111111",
  },
  cancel: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: { fontSize: 16, color: "#2255aa" },
  pressed: { opacity: 0.7 },
  list: {
    paddingVertical: 8,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", paddingRight: 12 },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 24, width: 32, textAlign: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 17, color: "#111111" },
  rowSubtitle: { marginTop: 2, fontSize: 13, color: "#777777" },
  pin: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  pinOn: { backgroundColor: "#111111", borderColor: "#111111" },
  pinText: { fontSize: 13, color: "#333333", fontWeight: "600" },
  pinTextOn: { color: "#ffffff" },
  empty: { padding: 24, color: "#777777", textAlign: "center" },
  chipBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    backgroundColor: "#ffffff",
  },
  chips: { paddingHorizontal: 12, gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#f2f2f2",
  },
  chipText: { fontSize: 14, color: "#111111" },
});
