// Search (PLAN.md D15): loose fuzzy matching over one local fixture, three
// action kinds, a chip row of quick links above the keyboard. Any URL
// result can be put on the Links tile from here (D35).

import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { linkEntries, toggleLink } from "../src/tiles/links/links";
import { Icon } from "../src/ui/Icon";
import { Text } from "../src/ui/Text";
import { colors, font, radius, space, type } from "../src/ui/theme";

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
  const onTile = new Set(linkEntries(prefs).map((e) => e.id));

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return ENTRIES;
    const hits = search(q, ENTRIES, (e) => [
      e.title,
      e.subtitle,
      ...e.keywords,
    ]);
    if (ONESEARCH && !hits.includes(ONESEARCH)) hits.push(ONESEARCH);
    return hits;
  }, [query]);

  const close = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const run = (entry: SearchEntry) => {
    const a = entry.action;
    if (a.kind === "url") {
      Linking.openURL(
        a.url.replace("{query}", encodeURIComponent(query.trim())),
      ).catch(() => {});
      return;
    }
    const href = a.kind === "route" ? a.route : `/${a.tile}`;
    if (router.canGoBack()) router.dismissTo(href);
    else router.replace(href);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <View style={styles.inputWrap}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search"
            autoFocus
            autoCorrect={false}
            placeholder="Search Dice"
            placeholderTextColor={colors.faint}
            returnKeyType="search"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => results[0] && run(results[0])}
            style={styles.input}
          />
        </View>
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
        {results.map((e, i) => {
          const isUrl = e.action.kind === "url";
          const isFallback = e === ONESEARCH && query.trim().length > 0;
          const subtitle = isFallback
            ? `Search the library for “${query.trim()}”`
            : isUrl && e.action.kind === "url"
              ? `Opens ${hostOf(e.action.url)}`
              : e.subtitle;
          return (
            <View key={e.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={e.title}
                onPress={() => run(e)}
                style={({ pressed }) => [
                  styles.rowMain,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Icon name={e.icon} size={18} color={colors.text} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{e.title}</Text>
                  <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
              </Pressable>
              {isUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    onTile.has(e.id)
                      ? `Remove ${e.title} from Links tile`
                      : `Add ${e.title} to Links tile`
                  }
                  onPress={() => update((p) => toggleLink(p, e.id))}
                  style={({ pressed }) => [
                    styles.pin,
                    onTile.has(e.id) && styles.pinOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    name={onTile.has(e.id) ? "check" : "plus"}
                    size={14}
                    color={onTile.has(e.id) ? colors.onDark : colors.text}
                  />
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
              <Icon name={e.icon} size={14} color={colors.text} />
              <Text style={styles.chipText}>{e.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
  },
  input: {
    ...type.body,
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    height: 44,
  },
  cancel: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: { ...type.body, color: colors.accent, fontWeight: "500" },
  pressed: { opacity: 0.7 },
  list: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: { ...type.body, fontWeight: "500" },
  rowSubtitle: { ...type.small, color: colors.muted, marginTop: 1 },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pinOn: { backgroundColor: colors.text, borderColor: colors.text },
  empty: {
    ...type.body,
    padding: space.xl,
    color: colors.muted,
    textAlign: "center",
  },
  chipBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    backgroundColor: colors.surface,
  },
  chips: { paddingHorizontal: space.md, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { ...type.small, color: colors.text, fontWeight: "500" },
});
