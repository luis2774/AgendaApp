import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AppointmentDetailScreen({ route }) {
  const { event } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.client}</Text>
      <Text style={styles.info}>
        {event.start.toLocaleString()} - {event.end.toLocaleString()}
      </Text>
      {event.notes && <Text style={styles.info}>Notes: {event.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  info: { fontSize: 18, marginBottom: 5 },
});
