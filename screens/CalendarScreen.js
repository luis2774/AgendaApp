import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Calendar } from "react-native-big-calendar";
import { appointments } from "../data/appointments";

export default function CalendarScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const goNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(next);
  };

  const goPrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.monthText}>
        {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </Text>

      <View style={styles.navRow}>
        <Button title="Prev Month" onPress={goPrevMonth} />
        <Button title="Next Month" onPress={goNextMonth} />
      </View>

      <Calendar
        events={appointments.map((a) => ({ ...a, title: a.client }))}
        height={600}
        date={currentDate}
        mode="month" // <-- month view only
        onPressEvent={(event) => navigation.navigate("AppointmentDetail", { event })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
