import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Dice</Text>
      <Text style={styles.subtitle}>
        Nothing here yet. The grid comes next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 32, fontWeight: "700" },
  subtitle: { marginTop: 8, color: "#666666" },
});
