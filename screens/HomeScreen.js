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

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";
import { getT } from "../i18n/translations";

export default function HomeScreen({ navigation }) {
  // Get appointments from context
  const { appointments } = useAppointments();
  
  // State for controlling the add appointment modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Business hours configuration
  const BUSINESS_START_HOUR = 9; // 9 AM
  const BUSINESS_END_HOUR = 16; // 4 PM
  const SLOT_DURATION_MINUTES = 120; // 2 hour slots

  /**
   * Sort all appointments chronologically (earliest first)
   * This ensures upcoming appointments are displayed in order
   */
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  /**
   * findOpenSlots: Calculates available time slots for booking
   * Only shows slots from TODAY onward.
   */
  const findOpenSlots = () => {
    const openSlots = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build map of appointments by date
    const appointmentsByDate = {};
    appointments.forEach((apt) => {
      const dateKey = new Date(
        apt.start.getFullYear(),
        apt.start.getMonth(),
        apt.start.getDate()
      ).getTime();

      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    });

    // Generate dates from today forward (next 7 days)
    const DAYS_TO_SHOW = 7;
    for (let dayOffset = 0; dayOffset < DAYS_TO_SHOW; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);

      const dateKey = date.getTime();
      const dayAppointments = (appointmentsByDate[dateKey] || []).sort(
        (a, b) => a.start.getTime() - b.start.getTime()
      );

      const businessStart = new Date(date);
      businessStart.setHours(BUSINESS_START_HOUR, 0, 0, 0);

      const businessEnd = new Date(date);
      businessEnd.setHours(BUSINESS_END_HOUR, 0, 0, 0);

      const isToday = dateKey === today.getTime();
      const effectiveBusinessStart = isToday && now > businessStart ? now : businessStart;

      // If no appointments, show full day slots
      if (dayAppointments.length === 0) {
        let slotStart = new Date(effectiveBusinessStart);
        while (slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000 <= businessEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
          openSlots.push({ start: new Date(slotStart), end: slotEnd, date: date.toDateString() });
          slotStart = new Date(slotEnd);
        }
        continue;
      }

      // Slot before first appointment
      const firstApt = dayAppointments[0];
      if (firstApt.start.getTime() > effectiveBusinessStart.getTime()) {
        const slotEnd = firstApt.start;
        const slotStart = new Date(slotEnd.getTime() - SLOT_DURATION_MINUTES * 60 * 1000);
        if (slotStart.getTime() >= effectiveBusinessStart.getTime()) {
          openSlots.push({ start: slotStart, end: slotEnd, date: date.toDateString() });
        }
      }

      // Slots between appointments
      for (let i = 0; i < dayAppointments.length - 1; i++) {
        const currentEnd = dayAppointments[i].end
          ? new Date(dayAppointments[i].end)
          : new Date(dayAppointments[i].start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

        const nextStart = dayAppointments[i + 1].start;
        const gapMs = nextStart.getTime() - currentEnd.getTime();
        const gapMinutes = gapMs / (1000 * 60);

        if (gapMinutes >= SLOT_DURATION_MINUTES) {
          let slotStart = new Date(currentEnd);
          while (slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000 <= nextStart.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
            openSlots.push({ start: new Date(slotStart), end: slotEnd, date: date.toDateString() });
            slotStart = new Date(slotEnd);
          }
        }
      }

      // Slot after last appointment
      const lastAptEnd = dayAppointments[dayAppointments.length - 1].end
        ? new Date(dayAppointments[dayAppointments.length - 1].end)
        : new Date(dayAppointments[dayAppointments.length - 1].start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

      if (lastAptEnd.getTime() < businessEnd.getTime()) {
        const slotStart = lastAptEnd;
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
        if (slotEnd.getTime() <= businessEnd.getTime()) {
          const effectiveSlotStart = isToday && slotStart.getTime() < now.getTime() ? now : slotStart;
          if (effectiveSlotStart.getTime() < slotEnd.getTime()) {
            openSlots.push({ start: effectiveSlotStart, end: slotEnd, date: date.toDateString() });
          }
        }
      }
    }

    return openSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  // Calculate available slots once when component renders
  const openSlots = findOpenSlots();

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalAppointments = appointments.length;
    const confirmedCount = appointments.filter(apt => apt.confirmed).length;
    const pendingCount = totalAppointments - confirmedCount;
    
    // Appointments today
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start.getFullYear(), apt.start.getMonth(), apt.start.getDate());
      return aptDate.getTime() === today.getTime();
    });

    // Upcoming appointments (from now)
    const upcomingAppointments = sortedAppointments.filter(apt => apt.start > now);

    // Next appointment
    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    return {
      total: totalAppointments,
      confirmed: confirmedCount,
      pending: pendingCount,
      today: todayAppointments.length,
      upcoming: upcomingAppointments.length,
      next: nextAppointment,
    };
  }, [appointments, sortedAppointments]);

  // Format time until next appointment
  const getTimeUntil = (date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return 'Now';
    }
  };

  // Get appointment duration (default 2 hours)
  const getAppointmentDuration = (appointment) => {
    if (appointment.end) {
      const diff = appointment.end.getTime() - appointment.start.getTime();
      const hours = diff / (1000 * 60 * 60);
      return `${hours.toFixed(1)}h`;
    }
    return '2h'; // Default duration
  };

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
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{getT("total")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>{getT("today")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueConfirmed]}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>{getT("confirmed")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValuePending]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{getT("pending")}</Text>
          </View>
        </View>

        {/* Next Appointment Highlight */}
        {stats.next && (
          <View style={styles.nextAppointmentCard}>
            <Text style={styles.nextAppointmentLabel}>Next Appointment</Text>
            <Text style={styles.nextAppointmentClient}>{stats.next.client}</Text>
            <View style={styles.nextAppointmentDetails}>
              <Text style={styles.nextAppointmentTime}>
                {stats.next.start.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}{" "}
                at {stats.next.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
              <Text style={styles.nextAppointmentCountdown}>
                in {getTimeUntil(stats.next.start)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate("Calendar", {
                  highlightDate: stats.next.start.toISOString(),
                })
              }
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Appointments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <Text style={styles.sectionSubtitle}>{stats.upcoming} upcoming</Text>
          </View>
          {sortedAppointments.length > 0 ? (
            <FlatList
              data={sortedAppointments}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isPast = item.start < new Date();
                return (
                  <View style={[styles.card, isPast && styles.cardPast]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.client}>{item.client}</Text>
                        <Text style={styles.duration}>{getAppointmentDuration(item)}</Text>
                      </View>
                      <View style={styles.badgeContainer}>
                        {item.reminder_sent && (
                          <View style={styles.reminderBadge}>
                            <Text style={styles.reminderBadgeText}>✓</Text>
                          </View>
                        )}
                        <Text style={item.confirmed ? styles.badge : styles.badgePending}>
                          {item.confirmed ? "Confirmed" : "Pending"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardDetails}>
                      <Text style={styles.details}>
                        {item.start.toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.detailsSeparator}>•</Text>
                      <Text style={styles.details}>
                        {item.start.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                      {!isPast && item.start > new Date() && (
                        <>
                          <Text style={styles.detailsSeparator}>•</Text>
                          <Text style={styles.timeUntil}>
                            {getTimeUntil(item.start)}
                          </Text>
                        </>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("Calendar", {
                          highlightDate: item.start.toISOString(),
                        })
                      }
                    >
                      <Text style={styles.actionButtonText}>View in Calendar</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No appointments scheduled</Text>
            </View>
          )}
        </View>

        {/* Available Time Slots Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            <Text style={styles.sectionSubtitle}>{openSlots.length} available</Text>
          </View>
          {openSlots.length > 0 ? (
            <FlatList
              data={openSlots}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item, index) => `slot-${item.start.getTime()}-${index}`}
              renderItem={({ item }) => {
                const isToday = new Date(item.start.getFullYear(), item.start.getMonth(), item.start.getDate()).getTime() === 
                                new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
                return (
                  <View style={styles.slotCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.slotDate}>
                          {isToday ? "Today" : item.start.toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <Text style={styles.slotDuration}>2h slot</Text>
                      </View>
                      <Text style={styles.badgeLight}>Open</Text>
                    </View>
                    <Text style={styles.slotTime}>
                      {item.start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      - {item.end.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => {
                        setSelectedDate(item.start);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.bookButtonText}>Book This Slot</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No available slots — schedule is full!</Text>
            </View>
          )}
        </View>

        {/* Add Appointment Modal */}
        <AddAppointmentModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  container: { 
    flex: 1, 
    backgroundColor: "#f1f5f9" 
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
  },
  
  // Header Styles
  screenHeader: { 
    marginBottom: 20 
  },
  screenTitle: { 
    fontSize: 34, 
    fontWeight: "700", 
    color: "#0f172a",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  screenSub: { 
    fontSize: 16, 
    color: "#64748b", 
    fontWeight: "400",
  },
  
  // Statistics Section
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  statValueConfirmed: {
    color: "#6366f1",
  },
  statValuePending: {
    color: "#f59e0b",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  // Next Appointment Card
  nextAppointmentCard: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  nextAppointmentLabel: {
    fontSize: 12,
    color: "#e0e7ff",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  nextAppointmentClient: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  nextAppointmentDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  nextAppointmentTime: {
    fontSize: 16,
    color: "#e0e7ff",
    fontWeight: "500",
    marginRight: 12,
  },
  nextAppointmentCountdown: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  viewButtonText: {
    color: "#6366f1",
    fontSize: 15,
    fontWeight: "600",
  },
  
  // Section Styles
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  separator: { 
    height: 12 
  },
  
  // Card Styles
  card: {
    padding: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  cardPast: {
    opacity: 0.6,
    borderLeftColor: "#94a3b8",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  client: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#0f172a",
    letterSpacing: -0.3,
    flex: 1,
  },
  duration: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
    overflow: "hidden",
  },
  badgePending: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
    overflow: "hidden",
  },
  badgeLight: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
    overflow: "hidden",
  },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  details: { 
    fontSize: 14, 
    color: "#475569", 
    fontWeight: "500",
  },
  detailsSeparator: {
    fontSize: 14,
    color: "#cbd5e1",
    marginHorizontal: 8,
  },
  timeUntil: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Slot Card Styles
  slotCard: {
    padding: 18,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  slotDate: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#166534",
    letterSpacing: -0.2,
  },
  slotDuration: {
    fontSize: 13,
    color: "#15803d",
    fontWeight: "500",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotTime: { 
    fontSize: 15, 
    color: "#15803d", 
    marginBottom: 14,
    fontWeight: "500",
  },
  bookButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Empty State
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#94a3b8",
    fontStyle: "italic",
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
