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


import { formatDate, formatTime } from "./helpers/timeFormat";  
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-big-calendar";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";
import { useLanguage } from '../context/LanguageContext';
import { getT } from '../i18n/translations';

// Get screen height for dynamic calendar sizing in week view
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function CalendarScreen({ navigation, route }) {
  const { language } = useLanguage();
  const calendarLocale = language === 'spanish' ? 'es' : 'en';
  
  const t = (key) => getT(key, language);
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
   */
  const handleDayPress = (day) => {
    if (day instanceof Date) {
      setSelectedDate(day);
      setModalVisible(true);
    }
  };

  /**
   * handleLongPressEvent: Called when user long-presses on an appointment event
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
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.monthText}>
            {formatDate(currentDate, language,{
              month: "long",
              year: "numeric",
              })}
          </Text>

          {/* Mode Toggle */}
          <View style={styles.modeRow}>
            <Button title={t('month')} onPress={() => setMode("month")} />
            <Button title={t('week')} onPress={() => setMode("week")} />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navRow}>
            <Button title={t('prev')} onPress={goPrev} />
            <Button title={t('next')} onPress={goNext} />
          </View>
        </View>

        {/* Calendar Container */}
        <View style={styles.calendarContainer}>
          <Calendar
          locale={calendarLocale}
            events={appointments.map((a) => ({
              ...a,
              title: a.client,
              end: a.end || new Date(a.start.getTime() + 60 * 60 * 1000),
            }))}
            date={currentDate}
            mode={mode}

            // ✅ BIGGER MONTH VIEW
            height={mode === "month" ? SCREEN_HEIGHT * 0.78 : SCREEN_HEIGHT * 0.85}

            hourRowHeight={70}
            hideNowIndicator
            showTime={false}

            // Spacing to avoid cramped events
            eventCellStyle={{
              backgroundColor: "#3b82f6",
              borderRadius: 12,
              paddingVertical: 4,
              paddingHorizontal: 6,
              marginVertical: 2,
              minHeight: 40,
            }}
            eventCellTextStyle={{
              fontSize: 12,
              fontWeight: "600",
              color: "#fff",
            }}

            dayHeaderStyle={{
              paddingVertical: 10,
              borderBottomWidth: 0,
            }}
            bodyContainerStyle={{
              borderTopWidth: 0,
            }}

            onPressCell={handleDayPress}
            onPressEvent={(event) => {
              const endTime = event.end || new Date(event.start.getTime() + 60 * 60 * 1000);
              const serializedEvent = {
                ...event,
                start: event.start.toISOString(),
                end: endTime.toISOString(),
                appointment_at: event.appointment_at ? event.appointment_at.toISOString() : null,
                reminder_at: event.reminder_at ? event.reminder_at.toISOString() : null,
              };
              navigation.navigate("AppointmentDetail", { event: serializedEvent });
            }}
            onLongPressEvent={handleLongPressEvent}
          />
        </View>

        {/* Add Appointment Modal */}
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
