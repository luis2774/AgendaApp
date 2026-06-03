import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppointments } from "../context/AppointmentsContext";
import { useClients } from "../context/ClientsContext";

export default function AddAppointmentModal({
  visible,
  onClose,
  selectedDate,
}) {
  const { addAppointment } = useAppointments();
  const { clients } = useClients();

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [duration, setDuration] = useState(2);

  const getInitialDate = () => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    if (selectedDate && date.getHours() !== 0 && date.getMinutes() !== 0) {
      return date;
    }
    date.setHours(9, 0, 0, 0);
    return date;
  };

  const [startTime, setStartTime] = useState(getInitialDate());

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        setStartTime(date);
      } else {
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        setStartTime(start);
      }
    }
  }, [selectedDate]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleSave = async () => {
    if (!selectedClientId) {
      Alert.alert("Falta Cliente", "Por favor selecciona un cliente.");
      return;
    }

    const appointmentDate = new Date(selectedDate || new Date());
    appointmentDate.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      0,
      0,
    );

    const endTime = new Date(appointmentDate);
    endTime.setHours(endTime.getHours() + duration);

    try {
      await addAppointment({
        client_id: selectedClientId,
        client: selectedClient?.name || "Cliente Desconocido",
        start: appointmentDate,
        end: endTime,
        duration: duration,
      });

      setSelectedClientId(null);
      setDuration(2);
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar la cita.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Agregar Cita</Text>

          <Text style={styles.label}>Seleccionar Cliente</Text>
          <TouchableOpacity
            style={styles.clientPicker}
            onPress={() => setShowClientPicker(!showClientPicker)}
          >
            <Text
              style={[
                styles.clientPickerText,
                !selectedClient && styles.placeholder,
              ]}
            >
              {selectedClient ? selectedClient.name : "Seleccionar Cliente"}
            </Text>
            <Text style={styles.chevron}>{showClientPicker ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {showClientPicker && (
            <View style={styles.clientList}>
              {clients.length === 0 ? (
                <View style={styles.emptyClientList}>
                  <Text style={styles.emptyClientText}>
                    No hay clientes disponibles
                  </Text>
                  <Text style={styles.emptyClientSubtext}>
                    Primero agrega clientes en la pantalla de Clientes
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
                        selectedClientId === item.id &&
                          styles.clientOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedClientId(item.id);
                        setShowClientPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.clientOptionText,
                          selectedClientId === item.id &&
                            styles.clientOptionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.phone && (
                        <Text style={styles.clientOptionPhone}>
                          {item.phone}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.clientListInner}
                  nestedScrollEnabled
                />
              )}
            </View>
          )}
          <View style={styles.durationSection}>
            <Text style={styles.label}>Duración (Horas)</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setDuration(Math.max(1, duration - 1))}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </TouchableOpacity>

              <View style={styles.durationDisplay}>
                <Text style={styles.durationValue}>{duration}</Text>
                <Text style={styles.durationUnit}>hrs</Text>
              </View>

              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setDuration(Math.min(8, duration + 1))}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timePickerContainer}>
            <Text style={styles.label}>Hora</Text>
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar Cita</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
  durationSection: {
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stepButton: {
    width: 44,
    height: 44,
    backgroundColor: "#6366f1",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  stepButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  durationDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginHorizontal: 30,
  },
  durationValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 4,
  },
});