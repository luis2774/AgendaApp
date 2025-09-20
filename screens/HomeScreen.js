import React from "react";
import { View, Text, FlatList, StyleSheet, Button } from "react-native";
import { appointments } from "../data/appointments";

export default function HomeScreen({ navigation }) {
  // Sort appointments by time
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  // Generate suggestions (simple version: find long gaps > 2 hours)
  const suggestions = [];
  for (let i = 0; i < sortedAppointments.length - 1; i++) {
    const current = sortedAppointments[i];
    const next = sortedAppointments[i + 1];
    const gapHours = (next.start - current.end) / (1000 * 60 * 60);

    if (gapHours >= 2) {
      suggestions.push(
        `You have a ${gapHours.toFixed(
          1
        )}-hour gap between ${current.client} and ${next.client}. Consider moving one to save time.`
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Appointments</Text>

      <FlatList
        data={sortedAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.client}>{item.client}</Text>
            <Text style={styles.details}>
              {item.start.toLocaleDateString()} •{" "}
              {item.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Button
              title="View in Calendar"
              onPress={() =>
                navigation.navigate("Calendar", { highlightDate: item.start.toISOString() })
              }
            />
          </View>
        )}
      />

      <Text style={styles.title}>Efficiency Suggestions</Text>
      {suggestions.length > 0 ? (
        suggestions.map((s, idx) => (
          <Text key={idx} style={styles.suggestion}>
            • {s}
          </Text>
        ))
      ) : (
        <Text style={styles.suggestion}>No suggestions — schedule looks efficient!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  card: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    marginBottom: 10,
  },
  client: { fontSize: 18, fontWeight: "600" },
  details: { fontSize: 14, color: "#555", marginBottom: 5 },
  suggestion: { fontSize: 14, color: "#333", marginBottom: 5 },
});
