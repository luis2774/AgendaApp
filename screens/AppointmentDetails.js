/**
 * AppointmentDetailScreen.js
 * 
 * Displays detailed information about a selected appointment.
 * Features:
 * - Displays client name, date, time, and dynamic duration badges.
 * - Mark as Completed: Updates database state to true and returns to the filtered calendar.
 * - Reschedule: Inline date-time picker to modify appointment timings.
 * - SMS Reminder: Triggers text reminders via the global appointments context.
 * - Delete: Triggers deletion with a confirmation alert prompt.
 */

import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppointments } from "../context/AppointmentsContext";
import { formatDate, formatTime } from "./helpers/timeFormat";

export default function AppointmentDetailScreen({ route, navigation }) {
  const { event: serializedEvent } = route.params;

  const [showPicker, setShowPicker] = useState(false);
  const [newTime, setNewTime] = useState(new Date(serializedEvent.start));
  const [isUpdating, setIsUpdating] = useState(false);

  // Grab matching real-time database cache records directly out of context using the ID
  const { appointments, deleteAppointment, sendReminder, updateAppointment } =
    useAppointments();

  // Look up the live instance of this exact appointment from global context state
  const dbAppointment = appointments.find((apt) => String(apt.id) === String(serializedEvent.id));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Detalles de la Cita",
    });
  }, [navigation]);

  const event = {
    ...serializedEvent,
    ...dbAppointment, // Merges up-to-date data properties like 'duration' and 'completed' dynamically
    start: new Date(serializedEvent.start),
  };

  // Extract duration accurately falling back safely to a 2 hour default structure
  const displayDuration = event.duration ? Number(event.duration) : 2;

  // Handles marking the appointment complete in the database and drops back to the calendar
  const handleMarkComplete = async () => {
    setIsUpdating(true);
    try {
      await updateAppointment(event.id, {
        completed: true, // Passes the new boolean flag to your database handler
      });
      Alert.alert("Éxito", "¡Cita completada!");
      navigation.goBack(); // Navigates back, where the calendar filters will now hide it
    } catch (error) {
      Alert.alert("Error", "No se pudo completar la cita.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async () => {
    setIsUpdating(true);
    try {
      await updateAppointment(event.id, {
        start: newTime,
        appointment_at: newTime.toISOString(),
        duration: displayDuration,
      });

      // Platform-aware success feedback
      if (Platform.OS === 'web') {
        window.alert("¡Cita reprogramada con éxito!");
      } else {
        Alert.alert("Éxito", "¡Cita reprogramada con éxito!");
      }

      setShowPicker(false);
      navigation.goBack();
    } catch (error) {
      // Platform-aware error feedback
      if (Platform.OS === 'web') {
        window.alert("Error: No se pudo actualizar la cita.");
      } else {
        Alert.alert("Error", "No se pudo actualizar la cita.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    const performDelete = async () => {
      await deleteAppointment(event.id);
      navigation.goBack();
    };

    if (Platform.OS === 'web') {
      // For Web: Use the browser's native confirm dialog
      if (window.confirm(`¿Eliminar la cita de ${event.client}?`)) {
        performDelete();
      }
    } else {
      // For Mobile: Use the existing Alert
      Alert.alert("Eliminar", `¿Eliminar la cita de ${event.client}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{event.client}</Text>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.info}>
              {formatDate(event.start, "spanish", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>

            <Text style={styles.info}>
              {formatTime(event.start, "spanish", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>

            {/* DURATION DISPLAY CHIP */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>
                Duración: {displayDuration}{" "}
                {displayDuration === 1 ? "Hora" : "Horas"}
              </Text>
            </View>
          </View>

          {/* MARK AS COMPLETED ACTION BUTTON */}
          <TouchableOpacity
            style={[styles.completeButton, isUpdating && styles.disabled]}
            onPress={handleMarkComplete}
            disabled={isUpdating}
          >
            <Text style={styles.completeButtonText}>✓ Marcar como Completada</Text>
          </TouchableOpacity>

          {!showPicker ? (
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.rescheduleButtonText}>Reprogramar Cita</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Hora</Text>

              {Platform.OS === 'web' ? (
                <input
                  type="datetime-local"
                  value={`${newTime.getFullYear()}-${(newTime.getMonth() + 1).toString().padStart(2, '0')}-${newTime.getDate().toString().padStart(2, '0')}T${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`}
                  onChange={(e) => {
                    // This parses the YYYY-MM-DDTHH:mm string correctly without UTC shifts
                    const [datePart, timePart] = e.target.value.split('T');
                    const [year, month, day] = datePart.split('-').map(Number);
                    const [hours, minutes] = timePart.split(':').map(Number);

                    const newDate = new Date(year, month - 1, day, hours, minutes);
                    setNewTime(newDate);
                  }}
                  style={styles.webTimeInput}
                />
              ) : (
                <DateTimePicker
                  value={newTime}
                  mode="datetime"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  textColor="#000000"
                  onChange={(e, date) => date && setNewTime(date)}
                  style={styles.picker}
                />
              )}

              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleReschedule}
                  disabled={isUpdating}
                >
                  <Text style={styles.confirmBtnText}>
                    {isUpdating ? "Guardando..." : "Confirmar Cambios"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.reminderButton,
              event.reminder_sent && styles.disabled,
            ]}
            onPress={() => !event.reminder_sent && sendReminder(event.id)}
          >
            <Text style={styles.reminderButtonText}>
              {event.reminder_sent
                ? "Recordatorio Enviado ✓"
                : "Enviar Recordatorio SMS"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Eliminar Cita</Text>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 15,
  },
  dateTimeContainer: { marginBottom: 20 },
  info: { fontSize: 18, color: "#64748b", marginBottom: 4 },
  durationBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  durationBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  completeButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  },
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
  pickerLabel: {
    textAlign: "center",
    fontWeight: "600",
    color: "#475569",
    marginBottom: 10,
  },
  picker: { height: 150 },
  pickerActions: { marginTop: 10, alignItems: "center" },
  confirmBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  webTimeInput: {
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    backgroundColor: '#fff',
  },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
  cancelText: { color: "#ef4444", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 25 },
  reminderButton: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  reminderButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  deleteButton: { padding: 16, alignItems: "center" },
  deleteButtonText: { color: "#ef4444", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
});