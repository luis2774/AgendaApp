import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { useAppointments } from "../context/AppointmentsContext";

export default function AddAppointmentScreen({ route, navigation }) {
  const { addAppointment } = useAppointments();
  const suggestedStart = route?.params?.suggestedStart
    ? new Date(route.params.suggestedStart)
    : null;
  const suggestedEnd = route?.params?.suggestedEnd
    ? new Date(route.params.suggestedEnd)
    : null;

  const [clientName, setClientName] = useState("");
  const [start, setStart] = useState(
    suggestedStart ? suggestedStart.toISOString().slice(0, 16) : ""
  );
  const [end, setEnd] = useState(suggestedEnd ? suggestedEnd.toISOString().slice(0, 16) : "");

  const handleSave = () => {
    if (!clientName.trim()) {
      Alert.alert("Missing name", "Please enter a client name.");
      return;
    }
    if (!start || !end) {
      Alert.alert("Missing time", "Please provide start and end date/time.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate <= startDate) {
      Alert.alert("Invalid time", "Please check start and end date/time.");
      return;
    }

    addAppointment({
      client: clientName.trim(),
      start: startDate,
      end: endDate,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Appointment</Text>
      <TextInput
        placeholder="Client name"
        value={clientName}
        onChangeText={setClientName}
        style={styles.input}
      />
      <Text style={styles.label}>Start (YYYY-MM-DDTHH:MM)</Text>
      <TextInput
        placeholder="2025-09-18T10:00"
        value={start}
        onChangeText={setStart}
        style={styles.input}
      />
      <Text style={styles.label}>End (YYYY-MM-DDTHH:MM)</Text>
      <TextInput
        placeholder="2025-09-18T11:00"
        value={end}
        onChangeText={setEnd}
        style={styles.input}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  label: { fontSize: 13, color: "#4b5563", marginBottom: 4 },
});