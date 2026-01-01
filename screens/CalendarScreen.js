/**
 * CalendarScreen.js
 * 
 * This screen displays a calendar view of all appointments with the following features:
 * - Month and Week view modes
 * - Navigation between months/weeks
 * - Tap on a day to add a new appointment
 * - Tap on an appointment to view details
 * - Long-press on an appointment to delete it
 * - Highlights dates when navigating from other screens
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-big-calendar";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";

// Get screen height for dynamic calendar sizing in week view
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function CalendarScreen({ navigation, route }) {
  // Get appointments and delete function from context
  const { appointments, deleteAppointment } = useAppointments();

  // State management:
  // - currentDate: The currently displayed month/week in the calendar
  // - mode: "month" or "week" view mode
  // - modalVisible: Controls visibility of the add appointment modal
  // - selectedDate: The date selected when tapping a day (used for new appointments)
  // - isDeleting: Loading state when deleting an appointment
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState("month");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Effect: Jump to highlighted date when navigating from other screens
   * This allows the calendar to automatically show a specific date when
   * navigating from the Home screen's "View in Calendar" button
   */
  useEffect(() => {
    const iso = route?.params?.highlightDate;
    if (iso) {
      const target = new Date(iso);
      if (!Number.isNaN(target)) setCurrentDate(target);
    }
  }, [route?.params?.highlightDate]);

  /**
   * handleDayPress: Called when user taps on an empty day cell in the calendar
   * Opens the add appointment modal with the selected date pre-filled
   */
  const handleDayPress = (day) => {
    if (day instanceof Date) {
      setSelectedDate(day);
      setModalVisible(true);
    }
  };

  /**
   * handleLongPressEvent: Called when user long-presses on an appointment event
   * Shows a confirmation dialog and deletes the appointment if confirmed
   */
  const handleLongPressEvent = (event) => {
    Alert.alert(
      "Delete Appointment",
      `Delete appointment with ${event.client} on ${event.start.toLocaleDateString()}?`,
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
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete appointment.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * goNext: Navigate to the next month or week
   * - Month mode: Moves forward one month
   * - Week mode: Moves forward 7 days
   */
  const goNext = () => {
    const next = new Date(currentDate);
    if (mode === "month") {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  /**
   * goPrev: Navigate to the previous month or week
   * - Month mode: Moves backward one month
   * - Week mode: Moves backward 7 days
   */
  const goPrev = () => {
    const prev = new Date(currentDate);
    if (mode === "month") {
      prev.setMonth(prev.getMonth() - 1);
      prev.setDate(1);
    } else {
      prev.setDate(prev.getDate() - 7);
    }
    setCurrentDate(prev);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section: Shows current month/year and navigation controls */}
        <View style={styles.header}>
          {/* Display current month and year */}
          <Text style={styles.monthText}>
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>

          {/* Mode Toggle: Switch between Month and Week view */}
          <View style={styles.modeRow}>
            <Button title="Month" onPress={() => setMode("month")} />
            <Button title="Week" onPress={() => setMode("week")} />
          </View>

          {/* Navigation Buttons: Move forward/backward through time */}
          <View style={styles.navRow}>
            <Button title="← Prev" onPress={goPrev} />
            <Button title="Next →" onPress={goNext} />
          </View>
        </View>

        {/* Calendar Container: The main calendar component */}
        <View style={styles.calendarContainer}>
          <Calendar
            // Map appointments to calendar events format (title = client name)
            events={appointments.map((a) => ({
              ...a,
              title: a.client,
            }))}
            date={currentDate} // Current date being displayed
            mode={mode} // "month" or "week" view
            height={mode === "month" ? 450 : SCREEN_HEIGHT * 0.85} // Dynamic height based on mode
            hourRowHeight={70} // Height of each hour row in week view
            hideNowIndicator // Hide the "current time" indicator line
            showTime={false} // Don't show time in event cells
            // Styling for appointment event cells
            eventCellStyle={{
              backgroundColor: "#3b82f6",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 6,
              minHeight: 44,
            }}
            // Styling for text inside event cells
            eventCellTextStyle={{
              fontSize: 14,
              fontWeight: "500",
              color: "#ffffff",
            }}
            // Styling for day headers (Monday, Tuesday, etc.)
            dayHeaderStyle={{
              paddingVertical: 10,
              borderBottomWidth: 0,
            }}
            // Styling for calendar body container
            bodyContainerStyle={{
              borderTopWidth: 0,
            }}
            // Handler: Called when tapping an empty day cell
            onPressCell={handleDayPress}
            // Handler: Called when tapping an appointment event (navigates to details)
            onPressEvent={(event) => {
              // Convert Date objects to ISO strings for navigation (React Navigation requires serializable params)
              const serializedEvent = {
                ...event,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                appointment_at: event.appointment_at ? event.appointment_at.toISOString() : null,
                reminder_at: event.reminder_at ? event.reminder_at.toISOString() : null,
              };
              navigation.navigate("AppointmentDetail", { event: serializedEvent });
            }}
            // Handler: Called when long-pressing an appointment event (deletes appointment)
            onLongPressEvent={handleLongPressEvent}
          />
        </View>

        {/* Add Appointment Modal: Opens when user taps a day */}
        <AddAppointmentModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          selectedDate={selectedDate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  monthText: {
    fontSize: 32,
    fontWeight: "500",
    textAlign: "center",
    color: "#1e293b",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
});
