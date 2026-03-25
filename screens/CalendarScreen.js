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
  TouchableOpacity,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';


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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.monthText}>
            {formatDate(currentDate, language, { month: "long", year: "numeric" })}
          </Text>
          
          {/* Navigation Arrows */}
          <View style={styles.navIcons}>
            <TouchableOpacity onPress={goPrev} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.iconBtn}>
              <Ionicons name="chevron-forward" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity 
            style={[styles.segment, mode === "month" && styles.activeSegment]} 
            onPress={() => setMode("month")}
          >
            <Text style={[styles.segmentText, mode === "month" && styles.activeSegmentText]}>
              {t('month')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segment, mode === "week" && styles.activeSegment]} 
            onPress={() => setMode("week")}
          >
            <Text style={[styles.segmentText, mode === "week" && styles.activeSegmentText]}>
              {t('week')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
          height={mode === "month" ? SCREEN_HEIGHT * 0.72 : SCREEN_HEIGHT * 0.78}
          hourRowHeight={70}
          hideNowIndicator
          showTime={mode === "week"} // Only show times in week view
          
          eventCellStyle={(event) => ({
            backgroundColor: "#6366f1", // Using a cleaner Indigo
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: "#4338ca", // Accent stripe
          })}
          
          onPressCell={handleDayPress}
          onPressEvent={(event) => {
            const endTime = event.end || new Date(event.start.getTime() + 60 * 60 * 1000);
            const serializedEvent = {
              ...event,
              start: event.start.toISOString(),
              end: endTime.toISOString(),
            };
            navigation.navigate("AppointmentDetail", { event: serializedEvent });
          }}
        />
      </View>

      <AddAppointmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#ffffff",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  navIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeSegment: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  activeSegmentText: {
    color: "#0f172a",
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    // Add a subtle border to separate header from calendar
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
});