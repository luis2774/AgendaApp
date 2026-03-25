import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppointments } from "../context/AppointmentsContext";

export default function AppointmentDetailScreen({ route, navigation }) {
  const { event: serializedEvent } = route.params;
  
  // Local state for rescheduling
  const [showPicker, setShowPicker] = useState(false);
  const [newTime, setNewTime] = useState(new Date(serializedEvent.start));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const { deleteAppointment, sendReminder, updateAppointment } = useAppointments();

  const event = {
    ...serializedEvent,
    start: new Date(serializedEvent.start),
  };

  const handleReschedule = async () => {
    setIsUpdating(true);
    try {
      await updateAppointment(event.id, { 
        start: newTime,
        // If your DB uses appointment_at, update that too:
        appointment_at: newTime.toISOString() 
      });
      Alert.alert("Success", "Appointment rescheduled!");
      setShowPicker(false);
      navigation.goBack(); 
    } catch (error) {
      Alert.alert("Error", "Could not update appointment.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete", `Delete appointment for ${event.client}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          await deleteAppointment(event.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{event.client}</Text>
          
          <View style={styles.dateTimeContainer}>
             <Text style={styles.info}>
               {event.start.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
             </Text>
             <Text style={styles.info}>
               {event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
             </Text>
          </View>

          {/* RESCHEDULE SECTION */}
          {!showPicker ? (
            <TouchableOpacity style={styles.rescheduleButton} onPress={() => setShowPicker(true)}>
              <Text style={styles.rescheduleButtonText}>Reschedule Appointment</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Select New Date & Time</Text>
              <DateTimePicker
                value={newTime}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                textColor="#000000" // Fixes the invisible text bug
                onChange={(e, date) => date && setNewTime(date)}
                style={styles.picker}
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleReschedule} disabled={isUpdating}>
                  <Text style={styles.confirmBtnText}>{isUpdating ? "Saving..." : "Confirm Changes"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* REMINDER & DELETE BUTTONS */}
          <TouchableOpacity 
            style={[styles.reminderButton, event.reminder_sent && styles.disabled]}
            onPress={() => !event.reminder_sent && sendReminder(event.id)}
          >
            <Text style={styles.reminderButtonText}>
              {event.reminder_sent ? "Reminder Sent ✓" : "Send SMS Reminder"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  content: { padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#1e293b", marginBottom: 15 },
  dateTimeContainer: { marginBottom: 20 },
  info: { fontSize: 18, color: "#64748b", marginBottom: 4 },
  
  rescheduleButton: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  rescheduleButtonText: { color: "#2563eb", fontWeight: "600", fontSize: 16 },

  pickerWrapper: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pickerLabel: { textAlign: "center", fontWeight: "600", color: "#475569", marginBottom: 10 },
  picker: { height: 150 },
  pickerActions: { marginTop: 10, alignItems: "center" },
  confirmBtn: { backgroundColor: "#2563eb", padding: 12, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 10 },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
  cancelText: { color: "#ef4444", fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 25 },
  reminderButton: { backgroundColor: "#6366f1", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  reminderButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  deleteButton: { padding: 16, alignItems: "center" },
  deleteButtonText: { color: "#ef4444", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 }
});