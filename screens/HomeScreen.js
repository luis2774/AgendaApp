import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  ScrollView,
} from "react-native";
import { useAppointments } from "../context/AppointmentsContext";

export default function HomeScreen({ navigation }) {
  const { appointments } = useAppointments();
  // Business hours: 9 AM to 5 PM
  const BUSINESS_START_HOUR = 9;
  const BUSINESS_END_HOUR = 17;
  const SLOT_DURATION_MINUTES = 60; // 1 hour slots

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  // Find open calendar slots
  const findOpenSlots = () => {
    const openSlots = [];
    
    // Group appointments by date
    const appointmentsByDate = {};
    sortedAppointments.forEach((apt) => {
      const dateKey = apt.start.toDateString();
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    });

    // Process each day
    Object.keys(appointmentsByDate).forEach((dateKey) => {
      const dayAppointments = appointmentsByDate[dateKey].sort(
        (a, b) => a.start.getTime() - b.start.getTime()
      );
      const date = dayAppointments[0].start;

      // Start of business day
      const businessStart = new Date(date);
      businessStart.setHours(BUSINESS_START_HOUR, 0, 0, 0);

      // End of business day
      const businessEnd = new Date(date);
      businessEnd.setHours(BUSINESS_END_HOUR, 0, 0, 0);

      // Check slot before first appointment
      if (dayAppointments.length > 0) {
        const firstApt = dayAppointments[0];
        if (firstApt.start.getTime() > businessStart.getTime()) {
          const slotEnd = firstApt.start;
          const slotStart = new Date(slotEnd.getTime() - SLOT_DURATION_MINUTES * 60 * 1000);
          if (slotStart.getTime() >= businessStart.getTime()) {
            openSlots.push({
              start: slotStart,
              end: slotEnd,
              date: dateKey,
            });
          }
        }
      }

      // Check slots between appointments
      for (let i = 0; i < dayAppointments.length - 1; i++) {
        const current = dayAppointments[i];
        const next = dayAppointments[i + 1];
        const gapMs = next.start.getTime() - current.end.getTime();
        const gapMinutes = gapMs / (1000 * 60);

        if (gapMinutes >= SLOT_DURATION_MINUTES) {
          // Find all available slots in this gap
          let slotStart = new Date(current.end);
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

      // Check slot after last appointment
      if (dayAppointments.length > 0) {
        const lastApt = dayAppointments[dayAppointments.length - 1];
        if (lastApt.end.getTime() < businessEnd.getTime()) {
          const slotStart = lastApt.end;
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
          if (slotEnd.getTime() <= businessEnd.getTime()) {
            openSlots.push({
              start: slotStart,
              end: slotEnd,
              date: dateKey,
            });
          }
        }
      }

      // If no appointments for the day, add all business hours slots
      if (dayAppointments.length === 0) {
        let slotStart = new Date(businessStart);
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

    return openSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const openSlots = findOpenSlots();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <FlatList
          data={sortedAppointments}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.client}>{item.client}</Text>
                <Text style={styles.badge}>Confirmed</Text>
              </View>
              <Text style={styles.details}>
                {item.start.toLocaleDateString()} •{" "}
                {item.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Time Slots</Text>
        {openSlots.length > 0 ? (
          <FlatList
            data={openSlots}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(item, index) => `slot-${item.start.getTime()}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.slotCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.slotDate}>{item.start.toLocaleDateString()}</Text>
                  <Text style={styles.badgeLight}>Open</Text>
                </View>
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
                <Button
                  title="Book This Slot"
                  onPress={() =>
                    navigation.navigate("AddAppointment", {
                      suggestedStart: item.start.toISOString(),
                      suggestedEnd: item.end.toISOString(),
                    })
                  }
                />
              </View>
            )}
          />
        ) : (
          <Text style={styles.noSlots}>No available slots — schedule is full!</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 32 },
  screenHeader: { marginBottom: 12 },
  screenTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  screenSub: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  separator: { height: 10 },
  card: {
    padding: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  client: { fontSize: 16, fontWeight: "700", color: "#111827" },
  details: { fontSize: 14, color: "#4b5563", marginBottom: 8 },
  badge: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeLight: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
  slotCard: {
    padding: 14,
    backgroundColor: "#ecfdf3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  slotDate: { fontSize: 15, fontWeight: "700", color: "#065f46" },
  slotTime: { fontSize: 14, color: "#065f46", marginBottom: 10 },
  noSlots: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
