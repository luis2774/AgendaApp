//this is the pop up that appears when user clicks on a calendar day to add a new appointment


import React, { useState, useEffect } from "react";
import { Modal, View, Text, Button, Alert, StyleSheet, Platform, TouchableOpacity, FlatList, ScrollView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppointments } from "../context/AppointmentsContext";
import { useClients } from "../context/ClientsContext";

export default function AddAppointmentModal({ visible, onClose, selectedDate }) {
  const { addAppointment } = useAppointments();
  const { clients } = useClients();

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  
  // Initialize with selectedDate or today, default to 9 AM
  const getInitialDate = () => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    // If selectedDate has a specific time, preserve it; otherwise default to 9 AM
    if (selectedDate && date.getHours() !== 0 && date.getMinutes() !== 0) {
      return date; // Use the actual time from selectedDate
    }
    date.setHours(9, 0, 0, 0);
    return date;
  };

  const [startTime, setStartTime] = useState(getInitialDate());

  // Update startTime when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      // If the date has a specific time (not midnight), use it
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        setStartTime(date);
      } else {
        // Otherwise default to 9 AM
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        setStartTime(start);
      }
    }
  }, [selectedDate]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleSave = async () => {
    if (!selectedClientId) {
      Alert.alert("Missing client", "Please select a client.");
      return;
    }

    // Combine selectedDate with the time picker value
    const appointmentDate = new Date(selectedDate || new Date());
    appointmentDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    try {
      await addAppointment({
        client_id: selectedClientId,
        client: selectedClient?.name || "Unknown Client",
        start: appointmentDate,
      });

      // Reset fields and close modal
      setSelectedClientId(null);
      const resetDate = getInitialDate();
      setStartTime(resetDate);
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save appointment.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Appointment</Text>
            
            <Text style={styles.label}>Select Client *</Text>
            <TouchableOpacity
              style={styles.clientPicker}
              onPress={() => setShowClientPicker(!showClientPicker)}
            >
              <Text style={[styles.clientPickerText, !selectedClient && styles.placeholder]}>
                {selectedClient ? selectedClient.name : "Select a client..."}
              </Text>
              <Text style={styles.chevron}>{showClientPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {showClientPicker && (
              <View style={styles.clientList}>
                {clients.length === 0 ? (
                  <View style={styles.emptyClientList}>
                    <Text style={styles.emptyClientText}>No clients available</Text>
                    <Text style={styles.emptyClientSubtext}>
                      Go to Clients screen to add clients first
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.clientOption,
                          selectedClientId === item.id && styles.clientOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedClientId(item.id);
                          setShowClientPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.clientOptionText,
                            selectedClientId === item.id && styles.clientOptionTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {item.phone && (
                          <Text style={styles.clientOptionPhone}>{item.phone}</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    style={styles.clientListInner}
                    nestedScrollEnabled
                  />
                )}
              </View>
            )}

          <View style={styles.timePickerContainer}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setStartTime(selectedTime);
                  }
                }}
                style={styles.picker}
              />
            </View>
          </View>

            <Button title="Save" onPress={handleSave} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" color="red" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 13, color: "#4b5563", marginBottom: 8, fontWeight: "600" },
  clientPicker: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientPickerText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  placeholder: {
    color: "#9ca3af",
  },
  chevron: {
    fontSize: 12,
    color: "#6b7280",
  },
  clientList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  clientListInner: {
    maxHeight: 200,
  },
  clientOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  clientOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  clientOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  clientOptionTextSelected: {
    fontWeight: "700",
    color: "#2563eb",
  },
  clientOptionPhone: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyClientList: {
    padding: 20,
    alignItems: "center",
  },
  emptyClientText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyClientSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  timePickerContainer: {
    
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    padding: 8,
    ...(Platform.OS === "ios" && {
      height: 200,
    }),
  },
  picker: {
    width: Platform.OS === "ios" ? "100%" : "auto",
  },
});
