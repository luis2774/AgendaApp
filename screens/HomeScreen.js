import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { formatDate, formatTime, getTimeUntil } from "./helpers/timeFormat";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../context/AppointmentsContext";
import AddAppointmentModal from "../components/AddAppointmentModal";
import { useLanguage } from "../context/LanguageContext";
import { getT } from "../i18n/translations";
import { getAvailableSlots } from "./helpers/slotFinder";
import * as Haptics from "expo-haptics";

export default function HomeScreen({ navigation }) {
  const { language } = useLanguage();
  const t = (key) => getT(key, language);
  const { appointments } = useAppointments();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsCollapsed, setSlotsCollapsed] = useState(false);

  // Constants
  const DAYS_TO_SHOW = 7;
  const START_HOUR = 9;
  const END_HOUR = 16;
  const DURATION = 120;

  // Optimized Logic using the helper we created
  const openSlots = useMemo(() => {
    return getAvailableSlots(appointments, {
      startHour: START_HOUR,
      endHour: END_HOUR,
      slotDuration: DURATION,
      daysToShow: DAYS_TO_SHOW,
    });
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
  }, [appointments]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayApts = appointments.filter(
      (a) => a.start >= todayStart && a.start <= todayEnd,
    );
    const upcomingApts = appointments.filter((a) => a.start > now);
    const confirmedCount = appointments.filter((a) => a.confirmed).length;

    return {
      totalAvailable: openSlots.length,
      todayCount: todayApts.length,
      confirmed: confirmedCount,
      pending: appointments.length - confirmedCount,
      next: upcomingApts.sort((a, b) => a.start - b.start)[0] || null,
    };
  }, [appointments, openSlots]);

  const handleBook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>{t("overview")}</Text>
          <Text style={styles.screenSub}>
            {formatDate(new Date(), language, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.activeStat]}>
            <Text style={styles.statValue}>{stats.todayCount}</Text>
            <Text style={styles.statLabel}>{t("today")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#6366f1" }]}>
              {stats.confirmed}
            </Text>
            <Text style={styles.statLabel}>{t("confirmed")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>{t("pending")}</Text>
          </View>
        </View>

        {/* Highlight Card */}
        {stats.next && (
          <Pressable
            style={({ pressed }) => [
              styles.nextAppointmentCard,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() =>
              navigation.navigate("Calendar", {
                highlightDate: stats.next.start.toISOString(),
              })
            }
          >
            <View style={styles.nextHeader}>
              <Text style={styles.nextAppointmentLabel}>
                {t("nextAppointment")}
              </Text>
              <Text style={styles.nextTag}>
                {t("in")} {getTimeUntil(stats.next.start)}
              </Text>
            </View>
            <Text style={styles.nextAppointmentClient}>
              {stats.next.client}
            </Text>
            <Text style={styles.nextAppointmentTime}>
              {formatTime(stats.next.start, language, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Pressable>
        )}

        {/* Upcoming Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("aUpcoming")}</Text>
          {sortedAppointments.length > 0 ? (
            sortedAppointments.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View
                    style={[
                      styles.timelineDot,
                      item.start < new Date() && styles.dotPast,
                    ]}
                  />
                  {index !== sortedAppointments.length - 1 && (
                    <View style={styles.verticalLine} />
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.appointmentCard,
                    item.start < new Date() && styles.cardPast,
                  ]}
                  onPress={() =>
                    navigation.navigate("Calendar", {
                      highlightDate: item.start.toISOString(),
                    })
                  }
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.clientName}>{item.client}</Text>
                    <Text style={styles.timeText}>
                      {formatTime(item.start, language)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.confirmed ? styles.badgeOk : styles.badgeWait,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {item.confirmed ? "✓" : "?"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t("noAppointments")}</Text>
          )}
        </View>

        {/* Available Slots Section */}
        <View style={[styles.section, { marginTop: 30 }]}>
          <TouchableOpacity
            style={styles.collapseHeader}
            onPress={() => setSlotsCollapsed(!slotsCollapsed)}
          >
            <Text style={styles.sectionTitle}>{t("apAvailable")}</Text>
            <Text style={styles.slotCount}>
              {openSlots.length} {t("open")}
            </Text>
          </TouchableOpacity>

          {!slotsCollapsed &&
            openSlots.map((slot, i) => (
              <TouchableOpacity
                key={i}
                style={styles.slotCard}
                onPress={() => {
                  setSelectedDate(slot.start);
                  setModalVisible(true);
                }}
              >
                <View>
                  <Text style={styles.slotDay}>
                    {formatDate(slot.start, language, {
                      month: "short",
                      weekday: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.slotTimeRange}>
                    {formatTime(slot.start, language)} -{" "}
                    {formatTime(slot.end, language)}
                  </Text>
                </View>
                <View style={styles.bookAction}>
                  <Text style={styles.bookText}>{t("book")}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>

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
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },

  // Header
  screenHeader: { marginBottom: 25 },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -1,
  },
  screenSub: { fontSize: 16, color: "#64748b", marginTop: 4 },

  // Stats Grid
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 25 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  activeStat: { borderWidth: 2, borderColor: "#6366f1" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 4,
  },

  // Next Appointment Card
  nextAppointmentCard: {
    backgroundColor: "#4f46e5",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  nextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  nextAppointmentLabel: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
  nextTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "600",
  },
  nextAppointmentClient: { color: "#fff", fontSize: 28, fontWeight: "800" },
  nextAppointmentTime: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    marginTop: 5,
    fontWeight: "500",
  },

  // Timeline & Sections
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 15,
  },
  timelineItem: { flexDirection: "row", minHeight: 80 },
  timelineLine: { width: 30, alignItems: "center" },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6366f1",
    marginTop: 24,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  dotPast: { backgroundColor: "#cbd5e1" },
  verticalLine: {
    position: "absolute",
    top: 30,
    bottom: 0,
    width: 2,
    backgroundColor: "#e2e8f0",
  },
  appointmentCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardPast: { opacity: 0.6 },
  clientName: { fontSize: 16, fontWeight: "700", color: "#334155" },
  timeText: { fontSize: 14, color: "#64748b", marginTop: 2 },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOk: { backgroundColor: "#dcfce7" },
  badgeWait: { backgroundColor: "#fef3c7" },
  badgeText: { fontWeight: "800", fontSize: 14 },

  // Slots
  collapseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  slotCount: { color: "#6366f1", fontWeight: "700" },
  slotCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    borderLeftColor: "#10b981",
  },
  slotDay: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    textTransform: "uppercase",
  },
  slotTimeRange: { fontSize: 16, fontWeight: "600", color: "#334155" },
  bookAction: {
    backgroundColor: "#10b981",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  emptyText: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
});
