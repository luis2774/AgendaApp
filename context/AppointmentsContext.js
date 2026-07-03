import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Alert, Platform } from "react-native";
import { appointments as initialAppointments } from "../data/appointments";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AppointmentsContext = createContext(null);

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);

  // Check if Supabase is configured
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setSupabaseEnabled(configured);
    if (!configured) {
      console.log("ℹ️ Supabase not configured, using local storage");
    } else {
      console.log("✅ Supabase configured and ready");
    }
  }, []);

  // Load appointments from Supabase on mount
  useEffect(() => {
    if (supabaseEnabled) {
      loadAppointments();
    } else {
      // Use local data if Supabase not configured
      setAppointments(initialAppointments);
      setLoading(false);
    }
  }, [supabaseEnabled]);

  // Load appointments from Supabase
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query appointments with join to clients table to get client name
      const { data, error: supabaseError } = await supabase
        .from("appointments")
        .select(
          `
          apt_id,
          client_id,
          appointment_at,
          reminder_at,
          reminder_sent,
          confirmed,
          created_at,
          duration,
          completed,
          clients:client_id (
            id,
            name,
            phone
          )
        `,
        )
        .order("appointment_at", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      // Convert Supabase timestamps to Date objects
      const convertedAppointments = (data || []).map((apt) => {
        const startTime = new Date(apt.appointment_at);
        const clientName = apt.clients?.name || "Unknown Client";

        return {
          id: apt.apt_id,
          client: clientName,
          client_id: apt.client_id,
          start: startTime,
          title: clientName,
          appointment_at: startTime,
          reminder_at: apt.reminder_at ? new Date(apt.reminder_at) : null,
          reminder_sent: apt.reminder_sent || false,
          confirmed: apt.confirmed || false,
          duration: apt.duration || 1, // Default to 1 hour if not provided
          completed: apt.completed || false,
        };
      });

      setAppointments(convertedAppointments);
    } catch (err) {
      console.error("Error loading appointments from Supabase:", err);
      setError(err.message || "Failed to load appointments");

      // Fallback to local data on error
      setAppointments(initialAppointments);
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment from Supabase (and local state)
  const deleteAppointment = async (appointmentId) => {
    //console.log("Attempting to delete appointment ID:", appointmentId);
    const previousAppointments = [...appointments];

    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));

    try {
      if (supabaseEnabled) {
        const { error: supabaseError } = await supabase
          .from("appointments")
          .delete()
          .eq("apt_id", appointmentId);

        if (supabaseError) throw supabaseError;
      }
    } catch (err) {
      setAppointments(previousAppointments);
      setError(err.message || "Failed to delete");

      // ADD THE PLATFORM CHECK HERE TOO
      if (Platform.OS !== 'web') {
        Alert.alert("Sync Error", "Could not delete appointment.");
      } else {
        console.error("Web Deletion Error:", err);
      }
    }
  };

  // Add appointment to Supabase (and local state)
  // Requires client_id (not client name) - clients must be created separately
  const addAppointment = async (appointment) => {
    const clientId = appointment.client_id;
    const appointmentAt = appointment.start; // Use start time as appointment_at

    if (!clientId) {
      throw new Error(
        "client_id is required. Please select an existing client.",
      );
    }

    // Get client name for optimistic update (will be replaced with actual data)
    const clientName = appointment.client || "Unknown Client";

    const newAppointment = {
      ...appointment,
      id: appointment.id ?? Date.now(),
      client: clientName,
      client_id: clientId,
      title: clientName,
    };

    // Optimistically update local state
    setAppointments((prev) => [...prev, newAppointment]);

    // If Supabase is enabled, save to database
    if (supabaseEnabled) {
      try {
        // Insert the appointment with the client_id
        const { data, error: supabaseError } = await supabase
          .from("appointments")
          .insert({
            client_id: clientId,
            appointment_at: appointmentAt.toISOString(),
            confirmed: false, // Default to not confirmed
            reminder_sent: false, // Default to not sent
            duration: appointment.duration || 1, // Default duration if not provided
            completed: false, // Default to not completed
          })
          .select(
            `
            apt_id,
            client_id,
            appointment_at,
            confirmed,
            duration,
            clients:client_id (
              id,
              name,
              phone
            )
          `,
          )
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        // Update with the actual data from Supabase
        const startTime = new Date(data.appointment_at);
        const clientNameFromDb = data.clients?.name || clientName;

        const convertedAppointment = {
          id: data.apt_id,
          client: clientNameFromDb,
          client_id: data.client_id,
          start: startTime,
          title: clientNameFromDb,
          appointment_at: startTime,
          confirmed: data.confirmed || false,
          reminder_sent: data.reminder_sent || false,
        };

        // Replace optimistic update with actual data
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === newAppointment.id ? convertedAppointment : apt,
          ),
        );
      } catch (err) {
        console.error("Error saving appointment to Supabase:", err);
        setError(err.message || "Failed to save appointment");
        // Remove optimistic update on error
        setAppointments((prev) =>
          prev.filter((apt) => apt.id !== newAppointment.id),
        );
        throw err; // Re-throw so UI can handle it
      }
    }
  };

  const updateAppointment = async (appointmentId, updates) => {
    const previousAppointments = [...appointments];

    // 1. UI Update (Instant)
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          const newDate = updates.start || apt.start;
          return { ...apt, ...updates, appointment_at: newDate };
        }
        return apt;
      }),
    );

    try {
      if (supabaseEnabled) {
        // 2. Data Preparation
        const isoString = updates.start
          ? new Date(updates.start).toISOString()
          : undefined;

        // Extract properties to prevent passing client-side specific UI extensions (like start/end Date objects)
        // while preserving database-level tracking values like 'completed', 'duration', etc.
        const { start, end, ...dbFriendlyUpdates } = updates;

        const payload = {
          ...dbFriendlyUpdates, // 🚀 Dynamically includes { completed: true } or any other column updates
        };

        // Only attach appointment_at if a new start date was actually passed down
        if (isoString) {
          payload.appointment_at = isoString;
        }

        const { data, error: supabaseError } = await supabase
          .from("appointments")
          .update(payload) // 🔑 Pass the complete structured payload here
          .eq("apt_id", appointmentId)
          .select();

        if (supabaseError) throw supabaseError;

        if (!data || data.length === 0) {
          console.error("⚠️ No row found with apt_id:", appointmentId);
          throw new Error("Appointment not found in database.");
        }

        console.log("✅ Supabase updated successfully");
      }
    } catch (err) {
      setAppointments(previousAppointments);

      // Add this check
      if (Platform.OS !== 'web') {
        Alert.alert("Sync Error", "Could not save to cloud. Reverting changes.");
      } else {
        console.log("Web Error (alert skipped):", err);
      }

      console.error("Supabase Sync Failed:", err);
    }
  };

  // Send SMS reminder for an appointment
  const sendReminder = async (appointmentId) => {
    const { sendSMSReminder } = await import("../lib/smsService");
    const result = await sendSMSReminder(appointmentId);

    if (result.success) {
      // Refresh appointments to get updated reminder_sent status
      await loadAppointments();
    }

    return result;
  };

  const value = useMemo(
    () => ({
      appointments,
      addAppointment,
      deleteAppointment,
      updateAppointment,
      sendReminder,
      loading,
      error,
      supabaseEnabled,
      refreshAppointments: loadAppointments,
    }),
    [appointments, loading, error, supabaseEnabled],
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const ctx = useContext(AppointmentsContext);
  if (!ctx)
    throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
};
