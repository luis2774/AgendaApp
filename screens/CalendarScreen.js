/**
 * CalendarScreen.js
 * * This screen displays a calendar view of all appointments with the following features:
 * - Month view (macroscopic grid) and Premium Week view (vertical dynamic timeline layout)
 * - Navigation between months/weeks/days
 * - Intertwined live busy/vacant slot calculations for actionable day planning
 * - Tap on a day/open slot to add a new appointment
 * - Tap on an appointment to view details
 * - Long-press on an appointment to delete it
 * - Shows completed appointments grayed out in both month and timeline views
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { formatDate, formatTime } from "./helpers/timeFormat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-big-calendar";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";
import { useLanguage } from "../context/LanguageContext";
import { getT } from "../i18n/translations";

import { getAvailableSlots } from "./helpers/slotFinder";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const BUSINESS_CONFIG = {
  startHour: 8, // 8:00 AM
  endHour: 17, // 5:00 PM
  slotDuration: 150, // 2 30 minutes hour slots
  daysToShow: 6, // Window size for finder look-ahead
};

export default function CalendarScreen({ navigation, route }) {
  const { language } = useLanguage();
  const calendarLocale = language === "spanish" ? "es" : "en";
  const t = (key) => getT(key, language);

  const { appointments, deleteAppointment } = useAppointments();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState("week");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const iso = route?.params?.highlightDate;
    if (iso) {
      const target = new Date(iso);
      if (!Number.isNaN(target)) setCurrentDate(target);
    }
  }, [route?.params?.highlightDate]);

  const getWeekDays = (anchorDate) => {
    const currentDayOfWeek = anchorDate.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const startOfWeek = new Date(anchorDate);
    startOfWeek.setDate(anchorDate.getDate() + distanceToMonday);

    const weekLabelsMap =
      language === "spanish"
        ? ["L", "M", "M", "J", "V", "S", "D"]
        : ["M", "T", "W", "T", "F", "S", "S"];

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return {
        label: weekLabelsMap[index],
        date: day.getDate(),
        fullDate: day,
      };
    });
  };

  const handleDayPress = (day) => {
    if (day instanceof Date) {
      setSelectedDate(day);
      setModalVisible(true);
    }
  };

  const handleLongPressEvent = (appointment) => {
    Alert.alert(
      "Delete Appointment",
      `Delete appointment with ${appointment.client} on ${appointment.start.toLocaleDateString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAppointment(appointment.id);
            } catch (error) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete appointment.",
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

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

  const navigateToDetail = (item) => {
    const fallbackDuration = item.duration ? Number(item.duration) : 2;
    const endTime =
      item.end ||
      new Date(
        new Date(item.start).getTime() + fallbackDuration * 60 * 60 * 1000,
      );

    const serializedEvent = {
      ...item,
      start: new Date(item.start).toISOString(),
      end: new Date(endTime).toISOString(),
      appointment_at: item.appointment_at
        ? new Date(item.appointment_at).toISOString()
        : null,
      reminder_at: item.reminder_at
        ? new Date(item.reminder_at).toISOString()
        : null,
      duration: fallbackDuration,
    };

    navigation.navigate("AppointmentDetail", { event: serializedEvent });
  };

  // 1. Unified Client Bookings Target Day (Reversed filter to display completed rows)
  const dayBookings = appointments
    .filter((app) => app.start.toDateString() === currentDate.toDateString())
    .map((app) => ({ ...app, isVacantSlot: false }));

  // 2. Fetch available open time segments from your custom slot finder utility
  const totalOpenSlots = getAvailableSlots(appointments, BUSINESS_CONFIG);
  const dayVacantSlots = totalOpenSlots
    .filter((slot) => slot.date === currentDate.toDateString())
    .map((slot, index) => ({
      id: `calculated-open-slot-${index}`,
      start: slot.start,
      end: slot.end,
      isVacantSlot: true,
    }));

  const unifiedTimelineData = [...dayBookings, ...dayVacantSlots].sort(
    (a, b) => a.start - b.start,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HEADER ROW */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          {mode === "month"
            ? formatDate(currentDate, language, {
                month: "long",
                year: "numeric",
              })
            : t("calendar")}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => handleDayPress(currentDate)}
            style={styles.iconActionBtn}
          >
            <Ionicons name="add-circle-outline" size={28} color="#0b1c30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEGMENTED VIEW CONTROL SWITCH */}
      <View style={styles.toggleWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, mode === "month" && styles.activeSegment]}
            onPress={() => setMode("month")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "month" && styles.activeSegmentText,
              ]}
            >
              {t("month")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, mode === "week" && styles.activeSegment]}
            onPress={() => setMode("week")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "week" && styles.activeSegmentText,
              ]}
            >
              {t("week")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RENDER VIEW CONTROLLER */}
      {mode === "month" ? (
        <View style={styles.calendarContainer}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={goPrev} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Calendar
            locale={calendarLocale}
            events={appointments.map((a) => {
              const itemDuration = a.duration ? Number(a.duration) : 2;
              return {
                ...a,
                title: a.client,
                end:
                  a.end ||
                  new Date(a.start.getTime() + itemDuration * 60 * 60 * 1000),
              };
            })}
            date={currentDate}
            mode="month"
            height={SCREEN_HEIGHT * 0.68}
            hideNowIndicator
            eventCellStyle={(event) => ({
              // 🚀 Gray out background color dynamically if the appointment is completed
              backgroundColor: event.completed ? "#94a3b8" : "#8b4ef7",
              borderRadius: 6,
              opacity: event.completed ? 0.6 : 1,
            })}
            onPressCell={handleDayPress}
            onPressEvent={navigateToDetail}
          />
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {/* WEEK CALENDAR HORIZONTAL NAVIGATION STRIP */}
          <View style={styles.weekStripWrapper}>
            <View style={styles.weekStripHeader}>
              <Text style={styles.weekStripTitle}>
                {formatDate(currentDate, language, {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <View style={styles.stripArrows}>
                <TouchableOpacity onPress={goPrev} style={styles.inlineArrow}>
                  <Ionicons name="chevron-back" size={18} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity onPress={goNext} style={styles.inlineArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekDaysRow}>
              {getWeekDays(currentDate).map((day, idx) => {
                const isSelected =
                  day.fullDate.toDateString() === currentDate.toDateString();
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCurrentDate(day.fullDate)}
                    style={styles.dayColumn}
                  >
                    <Text
                      style={[
                        styles.dayLabelText,
                        isSelected && styles.dayLabelActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                    <View
                      style={[
                        styles.dayNumBubble,
                        isSelected && styles.dayNumBubbleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumText,
                          isSelected && styles.dayNumTextActive,
                        ]}
                      >
                        {day.date}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DYNAMIC TIMELINE SCROLL STREAM */}
          <ScrollView
            contentContainerStyle={styles.agendaScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {unifiedTimelineData.length === 0 ? (
              <View style={styles.emptyDayPlaceholder}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={48}
                  color="#cbdbf5"
                />
                <Text style={styles.emptyPlaceholderText}>
                  Fuera del horario laboral o sin espacios
                </Text>
              </View>
            ) : (
              unifiedTimelineData.map((item) => {
                const completeTimeString = formatTime(item.start, language);
                const timeParts = completeTimeString.split(" ");
                const startTimeString = timeParts[0] || "";
                const amPmMarker = timeParts[1] || "";

                if (item.isVacantSlot) {
                  return (
                    <View key={item.id} style={styles.timelineRow}>
                      <View style={[styles.timeLabelColumn, { opacity: 0.4 }]}>
                        <Text style={styles.timeMainText}>
                          {startTimeString}
                        </Text>
                        <Text style={styles.timeAmPmText}>{amPmMarker}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDayPress(item.start)}
                        activeOpacity={0.7}
                        style={styles.emptyDashedBox}
                      >
                        <View style={styles.inlineDashedContent}>
                          <Text style={styles.emptyDashedText}>
                            Espacio disponible
                          </Text>
                          <Ionicons
                            name="add"
                            size={16}
                            color="#8590a6"
                            style={{ marginLeft: 4 }}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }

                const isCancelled = item.status?.toLowerCase() === "cancelado";
                const isPending = item.status?.toLowerCase() === "pendiente";

                let borderThemeColor = "#712edd";
                let statusIconName = "checkmark-circle";
                let statusIconColor = "#00a472";

                // Setup visual conditional parameters 
                if (item.completed) {
                  borderThemeColor = "#94a3b8"; // Gray left border edge
                  statusIconName = "checkmark-done-circle"; // Double check icons for completeness
                  statusIconColor = "#64748b";
                } else if (isPending) {
                  borderThemeColor = "#712edd";
                  statusIconName = "clock";
                  statusIconColor = "#ba1a1a";
                } else if (isCancelled) {
                  borderThemeColor = "#75777d";
                  statusIconName = "close-circle";
                  statusIconColor = "#75777d";
                }

                const rawDuration = item.duration ? Number(item.duration) : 2;
                const formattedDurationText =
                  rawDuration % 1 === 0
                    ? rawDuration.toFixed(0)
                    : rawDuration.toFixed(1);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.timelineRow,
                      (isCancelled || item.completed) && styles.opaqueGrayscale, // 🚀 Applies lower opacity styling layout
                    ]}
                  >
                    <View style={styles.timeLabelColumn}>
                      <Text style={styles.timeMainText}>{startTimeString}</Text>
                      <Text style={styles.timeAmPmText}>{amPmMarker}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigateToDetail(item)}
                      onLongPress={() => handleLongPressEvent(item)}
                      activeOpacity={0.9}
                      style={[
                        styles.premiumAppointmentCard,
                        { borderLeftColor: borderThemeColor },
                        isCancelled || item.completed
                          ? styles.cancelledCardBg // 🚀 Grays background out using the existing secondary blue/gray layout
                          : styles.normalCardBg,
                      ]}
                    >
                      <View style={styles.cardTopSegment}>
                        <View style={styles.clientProfileArea}>
                          <View style={styles.clientAvatarFallback}>
                            <Ionicons name="person" size={18} color="#8590a6" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.clientNameText,
                                (isCancelled || item.completed) && styles.lineThroughText, // 🚀 Crosses text off cleanly
                              ]}
                            >
                              {item.client}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name={statusIconName}
                          size={22}
                          color={statusIconColor}
                        />
                      </View>

                      <View style={styles.cardBottomSegment}>
                        <View style={styles.durationWrapper}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#75777d"
                          />
                          <Text style={styles.durationText}>
                            {formattedDurationText}{" "}
                            {Number(formattedDurationText) === 1
                              ? "Hora"
                              : "Horas"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      <AddAppointmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // styles preserved exactly as they were...
  safeArea: { flex: 1, backgroundColor: "#f8f9ff" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f8f9ff",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0b1c30",
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconActionBtn: { padding: 2 },
  toggleWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f8f9ff",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#e5eeff",
    borderRadius: 14,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 11,
  },
  activeSegment: {
    backgroundColor: "#ffffff",
    shadowColor: "#091426",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#8590a6" },
  activeSegmentText: { color: "#0b1c30" },
  calendarContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    shadowColor: "#091426",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 5,
  },
  monthNavRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 6,
  },
  arrowBtn: { padding: 6, backgroundColor: "#f8f9ff", borderRadius: 8 },
  timelineContainer: { flex: 1, backgroundColor: "#f8f9ff" },
  weekStripWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9ff",
  },
  weekStripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weekStripTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8590a6",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stripArrows: { flexDirection: "row", gap: 10 },
  inlineArrow: { padding: 2 },
  weekDaysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayColumn: { alignItems: "center", flex: 1 },
  dayLabelText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8590a6",
    marginBottom: 6,
  },
  dayLabelActive: { color: "#712edd", fontWeight: "800" },
  dayNumBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumBubbleActive: {
    backgroundColor: "#712edd",
    shadowColor: "#00a472",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNumText: { fontSize: 15, fontWeight: "600", color: "#0b1c30" },
  dayNumTextActive: { color: "#ffffff", fontWeight: "700" },
  agendaScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  timelineRow: { flexDirection: "row", marginBottom: 20 },
  timeLabelColumn: {
    width: 62,
    alignItems: "flex-end",
    paddingRight: 12,
    paddingTop: 4,
  },
  timeMainText: { fontSize: 16, fontWeight: "700", color: "#0b1c30" },
  timeAmPmText: { fontSize: 10, fontWeight: "600", color: "#8590a6" },
  premiumAppointmentCard: {
    flex: 1,
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: "#091426",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  normalCardBg: { backgroundColor: "#ffffff" },
  cancelledCardBg: { backgroundColor: "#eff4ff" },
  opaqueGrayscale: { opacity: 0.55 },
  cardTopSegment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "start",
  },
  clientProfileArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  clientAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  clientNameText: { fontSize: 16, fontWeight: "700", color: "#0b1c30" },
  lineThroughText: { textDecorationLine: "line-through" },
  cardBottomSegment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e5eeff",
  },
  durationWrapper: { flexDirection: "row", alignItems: "center", gap: 4 },
  durationText: { fontSize: 12, fontWeight: "500", color: "#75777d" },
  emptyDashedBox: {
    flex: 1,
    height: 72,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbdbf5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 244, 255, 0.3)",
  },
  inlineDashedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDashedText: { fontSize: 12, fontWeight: "600", color: "#8590a6" },
  emptyDayPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyPlaceholderText: { fontSize: 14, fontWeight: "500", color: "#8590a6" },
});