import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from "react-native";
import { Calendar } from "react-native-big-calendar";
import { useAppointments } from "../context/AppointmentsContext";

export default function CalendarScreen({ navigation, route }) {
  const { appointments, addAppointment } = useAppointments();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clientName, setClientName] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [showModal, setShowModal] = useState(false);

  // If navigated with highlightDate, jump the calendar to that day
  useEffect(() => {
    const iso = route?.params?.highlightDate;
    if (iso) {
      const target = new Date(iso);
      if (!Number.isNaN(target)) {
        setCurrentDate(target);
      }
    }
  }, [route?.params?.highlightDate]);

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
    if (
      Number.isNaN(h) ||
      Number.isNaN(m) ||
      h < 0 ||
      h > 23 ||
      m < 0 ||
      m > 59
    ) {
      return null;
    }
    const start = new Date(currentDate);
    start.setHours(h, m, 0, 0);
    return start;
  };

  const handleAdd = () => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (!clientName.trim()) {
      Alert.alert("Missing name", "Please enter a client name.");
      return;
    }
    if (!start || !end || end <= start) {
      Alert.alert("Invalid time", "Please check start/end times (HH:MM).");
      return;
    }

    addAppointment({
      client: clientName.trim(),
      start,
      end,
    });
    setClientName("");
    Alert.alert("Added", "Appointment added and visible on Home.");
    setShowModal(false);
  };

  const goNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(next);
  };

  const goPrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(prev);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.monthText}>
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>

            <View style={styles.navRow}>
              <Button title="Prev Month" onPress={goPrevMonth} />
              <Button title="Next Month" onPress={goNextMonth} />
            </View>

            <Calendar
              events={appointments.map((a) => ({ ...a, title: a.client }))}
              height={600}
              date={currentDate}
              mode="month" // <-- month view only
              onPressEvent={(event) => navigation.navigate("AppointmentDetail", { event })}
            />

            <View style={styles.inlineActions}>
              <Button title="Add Appointment" onPress={() => setShowModal(true)} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalCard}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.formTitle}>Add Appointment</Text>
                <TextInput
                  placeholder="Client name"
                  value={clientName}
                  onChangeText={setClientName}
                  style={styles.input}
                />
                <View style={styles.row}>
                  <View style={[styles.half, { marginRight: 6 }]}>
                    <Text style={styles.label}>Start (HH:MM)</Text>
                    <TextInput
                      value={startTime}
                      onChangeText={setStartTime}
                      style={styles.input}
                      placeholder="10:00"
                    />
                  </View>
                  <View style={[styles.half, { marginLeft: 6 }]}>
                    <Text style={styles.label}>End (HH:MM)</Text>
                    <TextInput
                      value={endTime}
                      onChangeText={setEndTime}
                      style={styles.input}
                      placeholder="11:00"
                    />
                  </View>
                </View>
                <View style={styles.modalButtons}>
                  <Button title="Cancel" onPress={() => setShowModal(false)} />
                  <Button title="Add to Calendar" onPress={handleAdd} />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inlineActions: { marginTop: 12 },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  half: { flex: 1 },
  label: { fontSize: 12, color: "#4b5563", marginBottom: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "75%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
