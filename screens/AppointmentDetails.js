/**
 * AppointmentDetails.js
 * 
 * This screen displays detailed information about a specific appointment.
 * 
 * Features:
 * - Shows client name, date, and time
 * - Displays appointment notes (if any)
 * - Allows deletion of the appointment with confirmation
 * - Automatically navigates back after successful deletion
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../context/AppointmentsContext";

export default function AppointmentDetailScreen({ route, navigation }) {
  // Get appointment data from navigation params (passed from calendar screen)
  const { event: serializedEvent } = route.params;
  
  // Convert ISO strings back to Date objects (React Navigation serializes Dates as strings)
  const event = {
    ...serializedEvent,
    start: new Date(serializedEvent.start),
    end: new Date(serializedEvent.end),
    appointment_at: serializedEvent.appointment_at ? new Date(serializedEvent.appointment_at) : null,
    reminder_at: serializedEvent.reminder_at ? new Date(serializedEvent.reminder_at) : null,
  };
  
  // Get functions from appointments context
  const { deleteAppointment, sendReminder } = useAppointments();
  
  // Loading states to prevent multiple operations
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  /**
   * handleSendReminder: Sends SMS reminder for the appointment
   * - Validates that client has phone number
   * - Checks if reminder already sent
   * - Sends SMS and refreshes appointment data
   */
  const handleSendReminder = async () => {
    // Check if client has phone number (need to get from appointments context)
    if (!event.client_id) {
      Alert.alert("Error", "Unable to send reminder. Client information not available.");
      return;
    }

    if (event.reminder_sent) {
      Alert.alert("Already Sent", "SMS reminder has already been sent for this appointment.");
      return;
    }

    setIsSendingReminder(true);
    try {
      const result = await sendReminder(event.id);
      if (result.success) {
        Alert.alert("Success", "SMS reminder sent successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to send reminder. Please check that the client has a valid phone number.");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reminder.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  /**
   * handleDelete: Shows confirmation dialog and deletes appointment if confirmed
   * - Shows alert with appointment details
   * - On confirm: Deletes appointment and navigates back
   * - On cancel: Does nothing
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Appointment",
      `Are you sure you want to delete the appointment with ${event.client}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAppointment(event.id);
              Alert.alert("Success", "Appointment deleted successfully.");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete appointment.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Appointment Details Card */}
        <View style={styles.card}>
          {/* Client Name: Main title of the appointment */}
          <Text style={styles.title}>{event.client}</Text>
          
          {/* Appointment Date: Full date with weekday */}
          <Text style={styles.info}>
            {event.start.toLocaleDateString([], {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
          
          {/* Appointment Time: Start and end time in 12-hour format */}
          <Text style={styles.info}>
            {event.start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })} - {event.end.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
          
          {/* Notes: Optional appointment notes (only shown if they exist) */}
          {event.notes && <Text style={styles.info}>Notes: {event.notes}</Text>}
          
          {/* Reminder Status: Show if reminder has been sent */}
          {event.reminder_sent && (
            <View style={styles.reminderStatus}>
              <Text style={styles.reminderStatusText}>✓ SMS Reminder Sent</Text>
            </View>
          )}
          
          {/* Send Reminder Button: Allows user to send SMS reminder */}
          <TouchableOpacity
            style={[
              styles.reminderButton, 
              (event.reminder_sent || isSendingReminder) && styles.reminderButtonDisabled
            ]}
            onPress={handleSendReminder}
            disabled={event.reminder_sent || isSendingReminder}
          >
            <Text style={styles.reminderButtonText}>
              {event.reminder_sent 
                ? "Reminder Sent ✓" 
                : isSendingReminder 
                ? "Sending..." 
                : "Send SMS Reminder"}
            </Text>
          </TouchableOpacity>
          
          {/* Delete Button: Allows user to cancel/delete the appointment */}
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={isDeleting} // Disable button while deletion is in progress
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "Deleting..." : "Delete Appointment"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 24, paddingBottom: 40 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "500", 
    marginBottom: 24,
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  info: { 
    fontSize: 17, 
    marginBottom: 16,
    color: "#64748b",
    fontWeight: "400",
    lineHeight: 24,
  },
  reminderStatus: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  reminderStatusText: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "500",
  },
  reminderButton: {
    backgroundColor: "#e0e7ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  reminderButtonDisabled: {
    opacity: 0.5,
  },
  reminderButtonText: {
    color: "#6366f1",
    fontSize: 17,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 17,
    fontWeight: "500",
  },
});
