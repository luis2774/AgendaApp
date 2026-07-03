/**
 * Clients.js
 * 
 * This screen manages the client database with full CRUD operations.
 * 
 * Features:
 * - View all clients with their information
 * - Add new clients
 * - Edit existing clients
 * - Delete clients (with protection if they have appointments)
 * - Shows appointment count and last appointment date for each client
 * - Displays loading and empty states
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Button, Alert,Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClients } from "../context/ClientsContext";
import { useAppointments } from "../context/AppointmentsContext";
import { useLanguage } from '../context/LanguageContext';
import { getT } from '../i18n/translations';

export default function ClientsScreen() {
  //get language from context
  const { language } = useLanguage();
  const t = (key) => getT(key, language);
  
  
  // Get client management functions from context
  const { clients, addClient, updateClient, deleteClient, loading } = useClients();
  
  // Get appointments to calculate statistics for each client
  const { appointments } = useAppointments();
  
  // State for managing the add/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // null = new client, object = editing
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  /**
   * getClientAppointmentCount: Counts how many appointments a client has
   * Used to prevent deletion of clients with active appointments
   * @param {string} clientId - The UUID of the client
   * @returns {number} - Number of appointments for this client
   */
  const getClientAppointmentCount = (clientId) => {
    return appointments.filter((apt) => apt.client_id === clientId).length;
  };

  /**
   * getClientLastAppointment: Gets the most recent appointment date for a client
   * Used to display when the client was last seen
   * @param {string} clientId - The UUID of the client
   * @returns {Date|null} - The date of the last appointment, or null if none
   */
  const getClientLastAppointment = (clientId) => {
    const clientAppointments = appointments
      .filter((apt) => apt.client_id === clientId)
      .sort((a, b) => b.start.getTime() - a.start.getTime()); // Sort descending (newest first)
    return clientAppointments[0]?.start;
  };

  /**
   * handleAddClient: Opens modal to add a new client
   * Resets form fields and sets editingClient to null (indicating new client)
   */
  const handleAddClient = () => {
    setEditingClient(null);
    setClientName("");
    setClientPhone("");
    setModalVisible(true);
  };

  /**
   * handleEditClient: Opens modal to edit an existing client
   * Pre-fills form fields with client's current data
   * @param {object} client - The client object to edit
   */
  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientPhone(client.phone || "");
    setModalVisible(true);
  };

  /**
   * handleSave: Saves a new client or updates an existing one
   * - Validates that name is provided
   * - Calls addClient or updateClient based on editingClient state
   * - Shows success/error alerts
   * - Closes modal and resets form on success
   */
  const handleSave = async () => {
    if (!clientName.trim()) {
      Alert.alert("No hay nombre", "Ingresa el nombre del cliente.");
      return;
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, {
          name: clientName.trim(),
          phone: clientPhone.trim(),
        });
        Alert.alert("Exito", "Cliente actualizado exitosamente.");
      } else {
        await addClient({
          name: clientName.trim(),
          phone: clientPhone.trim(),
        });
        Alert.alert("Exito", "Cliente agregado exitosamente.");
      }
      setModalVisible(false);
      setClientName("");
      setClientPhone("");
      setEditingClient(null);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save client.");
    }
  };

  /**
   * handleDelete: Deletes a client with safety checks
   * - Prevents deletion if client has appointments (data integrity)
   * - Shows confirmation dialog before deletion
   * - Shows success/error alerts
   * @param {object} client - The client object to delete
   */
 const handleDelete = (client) => {
  console.log("Delete button clicked for client:", client.name); // <--- DEBUG LINE

  const performDelete = async () => {
    try {
      await deleteClient(client.id);
      console.log("Delete successful");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (Platform.OS === 'web') {
    if (window.confirm(`¿Borrar a ${client.name}?`)) {
      performDelete();
    }
  } else {
    Alert.alert(
      "Borrar Cliente",
      `¿Estás seguro de que quieres borrar a ${client.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: performDelete },
      ]
    );
  }
};
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section: Shows screen title and client count */}
        <View style={styles.header}>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </Text>
        </View>

        {/* Add New Client Button: Opens modal to create a new client */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <Text style={styles.addButtonText}>Agregar Cliente</Text>
        </TouchableOpacity>

        {/* Loading State: Shows while fetching clients from database */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando clientes...</Text>
          </View>
        ) : clients.length > 0 ? (
          /* Clients List: Displays all clients with their information */
          <View style={styles.list}>
            {clients.map((client) => {
              // Calculate statistics for this client
              const appointmentCount = getClientAppointmentCount(client.id);
              const lastAppointment = getClientLastAppointment(client.id);
              
              return (
                <View key={client.id} style={styles.clientCard}>
                  {/* Client Header: Name, phone, and appointment count badge */}
                  <View style={styles.clientHeader}>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      {/* Phone number (only shown if provided) */}
                      {client.phone ? (
                        <Text style={styles.clientPhone}>{client.phone}</Text>
                      ) : null}
                    </View>
                    {/* Badge showing number of appointments */}
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {appointmentCount}{" "}
                        {appointmentCount === 1 ? "cita" : "citas"}
                      </Text>
                    </View>
                  </View>
                  {/* Last appointment date (only shown if client has appointments) */}
                  {lastAppointment && (
                    <Text style={styles.lastAppointment}>
                      Ultima cita: {lastAppointment.toLocaleDateString()}
                    </Text>
                  )}
                  {/* Action Buttons: Edit and Delete */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditClient(client)}
                    >
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(client)}
                    >
                      <Text style={styles.deleteButtonText}>Borrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty State: Shown when no clients exist */
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay clientes</Text>
            
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Client Modal: Form for creating or editing clients */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {/* Modal Title: Changes based on whether adding or editing */}
            <Text style={styles.modalTitle}>
              {editingClient ? "Editar Cliente" : "Agregar Cliente"}
            </Text>

            {/* Client Name Input: Required field */}
            <Text style={styles.label}>Agregar Cliente</Text>
            <TextInput
              placeholder="Agregar Cliente"
              value={clientName}
              onChangeText={setClientName}
              style={styles.input}
            />

            {/* Phone Number Input: Optional field */}
            <Text style={styles.label}>Numero de telefono</Text>
            <TextInput
              placeholder="Numero de telefono"
              value={clientPhone}
              onChangeText={setClientPhone}
              style={styles.input}
              keyboardType="phone-pad" // Shows numeric keypad on mobile
            />

            {/* Modal Action Buttons: Save and Cancel */}
            <View style={styles.modalActions}>
              <Button
                title="Guardar"
                onPress={handleSave}
              />
              <View style={{ height: 10 }} />
              <Button
                title="Cancelar"
                color="red"
                onPress={() => {
                  // Reset form and close modal
                  setModalVisible(false);
                  setClientName("");
                  setClientPhone("");
                  setEditingClient(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "400",
  },
  addButton: {
    backgroundColor: "#712edd",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  list: {
    gap: 16,
  },
  clientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 19,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  clientPhone: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "400",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6366f1",
  },
  lastAppointment: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 16,
    fontWeight: "400",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#6366f1",
    fontWeight: "500",
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontWeight: "500",
    fontSize: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "500",
    marginBottom: 24,
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#1e293b",
  },
  modalActions: {
    marginTop: 16,
  },
});
