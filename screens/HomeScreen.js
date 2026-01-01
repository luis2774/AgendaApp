/**
 * HomeScreen.js
 * 
 * This is the main dashboard screen that displays:
 * - Schedule overview with current date
 * - List of upcoming appointments
 * - Available time slots for booking
 * 
 * Features:
 * - Shows all appointments sorted by time
 * - Calculates and displays open time slots between appointments
 * - Allows booking appointments directly from available slots
 * - Navigates to calendar view for specific appointments
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";

export default function HomeScreen({ navigation }) {
  // Get appointments from context
  const { appointments } = useAppointments();
  
  // State for controlling the add appointment modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Business hours configuration
  // These define when appointments can be scheduled
  const BUSINESS_START_HOUR = 9; // 9 AM
  const BUSINESS_END_HOUR = 17; // 5 PM
  const SLOT_DURATION_MINUTES = 60; // 1 hour slots

  /**
   * Sort all appointments chronologically (earliest first)
   * This ensures upcoming appointments are displayed in order
   */
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  /**
   * findOpenSlots: Calculates available time slots for booking
   * 
   * Algorithm:
   * 1. Filters appointments to only include today and future dates
   * 2. Groups appointments by date (using date string as key)
   * 3. For each day, finds gaps between appointments
   * 4. Checks slots before first appointment, between appointments, and after last appointment
   * 5. Only includes slots that fit within business hours (9 AM - 5 PM)
   * 6. For today, only shows slots that are in the future (not past times)
   * 7. Returns slots that are at least 1 hour long
   * 
   * Returns: Array of {start, end, date} objects representing available slots
   */
  const findOpenSlots = () => {
    const openSlots = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Step 1: Filter appointments to only include today and future dates
    const futureAppointments = sortedAppointments.filter((apt) => {
      const aptDate = new Date(apt.start.getFullYear(), apt.start.getMonth(), apt.start.getDate());
      return aptDate.getTime() >= todayStart.getTime();
    });
    
    // Step 2: Group appointments by date (using date string as key)
    const appointmentsByDate = {};
    futureAppointments.forEach((apt) => {
      const dateKey = apt.start.toDateString();
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    });

    // Step 3: Process each day to find available slots
    Object.keys(appointmentsByDate).forEach((dateKey) => {
      // Sort appointments for this day by start time
      const dayAppointments = appointmentsByDate[dateKey].sort(
        (a, b) => a.start.getTime() - b.start.getTime()
      );
      const date = dayAppointments[0].start;

      // Calculate business day boundaries (9 AM - 5 PM)
      const businessStart = new Date(date);
      businessStart.setHours(BUSINESS_START_HOUR, 0, 0, 0);

      const businessEnd = new Date(date);
      businessEnd.setHours(BUSINESS_END_HOUR, 0, 0, 0);

      // For today, adjust businessStart to current time if it's later in the day
      const isToday = dateKey === now.toDateString();
      const effectiveBusinessStart = isToday && now.getTime() > businessStart.getTime() 
        ? now 
        : businessStart;

      // Step 4a: Check for slot before first appointment of the day
      if (dayAppointments.length > 0) {
        const firstApt = dayAppointments[0];
        if (firstApt.start.getTime() > effectiveBusinessStart.getTime()) {
          const slotEnd = firstApt.start;
          const slotStart = new Date(slotEnd.getTime() - SLOT_DURATION_MINUTES * 60 * 1000);
          // Ensure slot starts at or after effective business start (current time for today)
          if (slotStart.getTime() >= effectiveBusinessStart.getTime()) {
            openSlots.push({
              start: slotStart,
              end: slotEnd,
              date: dateKey,
            });
          }
        }
      }

      // Step 4b: Check for slots between consecutive appointments
      for (let i = 0; i < dayAppointments.length - 1; i++) {
        const current = dayAppointments[i];
        const next = dayAppointments[i + 1];
        const gapMs = next.start.getTime() - current.end.getTime();
        const gapMinutes = gapMs / (1000 * 60);

        // If gap is at least 1 hour, find all possible slots in that gap
        if (gapMinutes >= SLOT_DURATION_MINUTES) {
          let slotStart = new Date(current.end);
          // Create multiple slots if gap is larger than 1 hour
          while (slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000 <= next.start.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
            openSlots.push({
              start: new Date(slotStart),
              end: slotEnd,
              date: dateKey,
            });
            slotStart = new Date(slotEnd);
          }
        }
      }

      // Step 4c: Check for slot after last appointment of the day
      if (dayAppointments.length > 0) {
        const lastApt = dayAppointments[dayAppointments.length - 1];
        if (lastApt.end.getTime() < businessEnd.getTime()) {
          const slotStart = lastApt.end;
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
          // For today, ensure slot starts at or after current time
          const effectiveSlotStart = isToday && slotStart.getTime() < now.getTime() 
            ? now 
            : slotStart;
          if (effectiveSlotStart.getTime() < slotEnd.getTime() && slotEnd.getTime() <= businessEnd.getTime()) {
            openSlots.push({
              start: effectiveSlotStart,
              end: slotEnd,
              date: dateKey,
            });
          }
        }
      }

      // Step 4d: If no appointments for the day, add all business hours as available slots
      if (dayAppointments.length === 0) {
        let slotStart = new Date(effectiveBusinessStart);
        while (slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000 <= businessEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
          openSlots.push({
            start: new Date(slotStart),
            end: slotEnd,
            date: dateKey,
          });
          slotStart = new Date(slotEnd);
        }
      }
    });

    // Filter out any slots that are in the past (safety check)
    const validSlots = openSlots.filter((slot) => slot.start.getTime() >= now.getTime());
    
    return validSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  // Calculate available slots once when component renders
  const openSlots = findOpenSlots();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section: Shows screen title and current date */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Schedule Overview</Text>
          <Text style={styles.screenSub}>
            {new Date().toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Upcoming Appointments Section: Lists all scheduled appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <FlatList
            data={sortedAppointments} // Display appointments in chronological order
            scrollEnabled={false} // Disable scrolling (handled by parent ScrollView)
            ItemSeparatorComponent={() => <View style={styles.separator} />} // Spacing between items
            keyExtractor={(item) => item.id.toString()} // Unique key for each item
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Card header with client name and status badge */}
                <View style={styles.cardHeader}>
                  <Text style={styles.client}>{item.client}</Text>
                  <Text style={item.confirmed ? styles.badge : styles.badgePending}>
                    {item.confirmed ? "Confirmed" : "Pending"}
                  </Text>
                </View>
                {/* Appointment date and time */}
                <Text style={styles.details}>
                  {item.start.toLocaleDateString()} •{" "}
                  {item.start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
                {/* Button to view this appointment in the calendar */}
                <Button
                  title="View in Calendar"
                  onPress={() =>
                    navigation.navigate("Calendar", {
                      highlightDate: item.start.toISOString(),
                    })
                  }
                />
              </View>
            )}
          />
        </View>

        {/* Available Time Slots Section: Shows open slots for booking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {openSlots.length > 0 ? (
            <FlatList
              data={openSlots} // Display calculated available slots
              scrollEnabled={false} // Disable scrolling (handled by parent ScrollView)
              ItemSeparatorComponent={() => <View style={styles.separator} />} // Spacing between items
              keyExtractor={(item, index) => `slot-${item.start.getTime()}-${index}`} // Unique key
              renderItem={({ item }) => (
                <View style={styles.slotCard}>
                  {/* Slot header with date and "Open" badge */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.slotDate}>{item.start.toLocaleDateString()}</Text>
                    <Text style={styles.badgeLight}>Open</Text>
                  </View>
                  {/* Slot time range (start - end) */}
                  <Text style={styles.slotTime}>
                    {item.start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })} -{" "}
                    {item.end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  {/* Button to book this specific time slot */}
                  <Button
                    title="Book This Slot"
                    onPress={() => {
                      setSelectedDate(item.start); // Pre-fill the date in the modal
                      setModalVisible(true); // Open the add appointment modal
                    }}
                  />
                </View>
              )}
            />
          ) : (
            // Empty state: No available slots
            <Text style={styles.noSlots}>No available slots — schedule is full!</Text>
          )}
        </View>

        {/* Add Appointment Modal: Opens when booking a slot or adding new appointment */}
        <AddAppointmentModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate} // Pre-selected date when booking from a slot
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 24, paddingBottom: 40 },
  screenHeader: { marginBottom: 24 },
  screenTitle: { 
    fontSize: 32, 
    fontWeight: "600", 
    color: "#1e293b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSub: { 
    fontSize: 16, 
    color: "#64748b", 
    marginTop: 4,
    fontWeight: "400",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  separator: { height: 16 },
  card: {
    padding: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  client: { 
    fontSize: 17, 
    fontWeight: "500", 
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  details: { 
    fontSize: 15, 
    color: "#64748b", 
    marginBottom: 12,
    fontWeight: "400",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    color: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: "500",
    overflow: "hidden",
  },
  badgePending: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: "500",
    overflow: "hidden",
  },
  badgeLight: {
    backgroundColor: "#dbeafe",
    color: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: "500",
    overflow: "hidden",
  },
  slotCard: {
    padding: 18,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
  },
  slotDate: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: "#166534",
    letterSpacing: -0.2,
  },
  slotTime: { 
    fontSize: 15, 
    color: "#15803d", 
    marginBottom: 12,
    fontWeight: "400",
  },
  noSlots: {
    fontSize: 15,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 12,
    paddingHorizontal: 4,
    fontWeight: "400",
  },
});
