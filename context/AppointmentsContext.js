import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
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
      console.log('ℹ️ Supabase not configured, using local storage');
    } else {
      console.log('✅ Supabase configured and ready');
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
        .from('appointments')
        .select(`
          apt_id,
          client_id,
          appointment_at,
          reminder_at,
          reminder_sent,
          confirmed,
          created_at,
          clients:client_id (
            id,
            name,
            phone
          )
        `)
        .order('appointment_at', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      // Convert Supabase timestamps to Date objects
      const convertedAppointments = (data || []).map((apt) => {
        const startTime = new Date(apt.appointment_at);
        const clientName = apt.clients?.name || 'Unknown Client';
        
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
        };
      });

      setAppointments(convertedAppointments);
    } catch (err) {
      console.error('Error loading appointments from Supabase:', err);
      setError(err.message || 'Failed to load appointments');
      // Fallback to local data on error
      setAppointments(initialAppointments);
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment from Supabase (and local state)
  const deleteAppointment = async (appointmentId) => {
    // Validate appointmentId
    if (!appointmentId) {
      throw new Error('Appointment ID is required');
    }

    // Find the appointment in local state
    const appointmentToDelete = appointments.find((apt) => apt.id === appointmentId);
    
    if (!appointmentToDelete) {
      throw new Error('Appointment not found in local state');
    }

    // Check if Supabase is actually configured (double-check, not just state)
    const isConfigured = isSupabaseConfigured();
    
    // Debug: Log current state
    console.log('🔍 Delete appointment - Debug info:', {
      appointmentId,
      apt_id: appointmentToDelete.id,
      client: appointmentToDelete.client,
      supabaseEnabled,
      isSupabaseConfigured: isConfigured,
      hasSupabaseClient: !!supabase,
    });

    // If Supabase is configured, delete from database FIRST
    // Use isConfigured check as well as supabaseEnabled state
    if ((supabaseEnabled || isConfigured) && supabase) {
      try {
        console.log('🗑️ Attempting to delete appointment from Supabase:', { 
          appointmentId, 
          apt_id: appointmentToDelete.id,
          client: appointmentToDelete.client,
          table: 'appointments',
          column: 'apt_id'
        });
        
        // Verify Supabase client is valid before using
        if (!supabase || typeof supabase.from !== 'function') {
          throw new Error('Supabase client is not properly initialized');
        }
        
        // Delete from Supabase using apt_id (which matches the local id)
        const { data, error: supabaseError } = await supabase
          .from('appointments')
          .delete()
          .eq('apt_id', appointmentId)
          .select();

        console.log('📊 Supabase delete response:', { data, error: supabaseError });

        if (supabaseError) {
          console.error('❌ Supabase delete error:', {
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint,
            code: supabaseError.code,
          });
          setError(supabaseError.message || 'Failed to delete appointment from database');
          throw new Error(`Failed to delete appointment: ${supabaseError.message || 'Unknown error'}`);
        }

        // Verify deletion was successful
        // If data is empty/null, it could be RLS blocking the delete (even though row exists)
        if (!data || data.length === 0) {
          const errorMsg = 'No rows deleted from Supabase. This is likely due to RLS (Row Level Security) permissions. Please check your DELETE policy on the appointments table.';
          console.error('❌', errorMsg);
          console.error('🔍 Troubleshooting:');
          console.error('   1. Check if RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = \'appointments\';');
          console.error('   2. Check existing policies: SELECT * FROM pg_policies WHERE tablename = \'appointments\';');
          console.error('   3. You may need to create a DELETE policy. See FIX_RLS_DELETE_POLICY.sql');
          setError(errorMsg);
          throw new Error(errorMsg);
        } else {
          console.log('✅ Successfully deleted appointment from Supabase:', data);
        }

        // Only remove from local state after successful Supabase deletion
        console.log('🔄 Removing appointment from local state...');
        setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));

        // Reload appointments to ensure sync with database
        // Wrap in try-catch so reload failure doesn't undo successful deletion
        try {
          console.log('🔄 Reloading appointments from Supabase...');
          await loadAppointments();
          console.log('✅ Appointments reloaded successfully');
        } catch (reloadError) {
          console.warn('⚠️ Failed to reload appointments after deletion, but deletion was successful:', reloadError);
          // Don't throw - deletion succeeded, reload failure is non-critical
        }

      } catch (err) {
        console.error('❌ Error deleting appointment from Supabase:', err);
        setError(err.message || 'Failed to delete appointment');
        // Don't remove from local state if Supabase deletion failed
        throw err; // Re-throw so UI can handle it
      }
    } else {
      // Supabase not enabled - delete from local state only
      console.log('⚠️ Supabase not enabled, deletion only from local state');
      console.log('🔍 Supabase config check:', {
        isConfigured: isSupabaseConfigured(),
        supabaseEnabled,
      });
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
    }
  };

  // Add appointment to Supabase (and local state)
  // Requires client_id (not client name) - clients must be created separately
  const addAppointment = async (appointment) => {
    const clientId = appointment.client_id;
    const appointmentAt = appointment.start; // Use start time as appointment_at

    if (!clientId) {
      throw new Error('client_id is required. Please select an existing client.');
    }

    // Get client name for optimistic update (will be replaced with actual data)
    const clientName = appointment.client || 'Unknown Client';

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
          .from('appointments')
          .insert({
            client_id: clientId,
            appointment_at: appointmentAt.toISOString(),
            confirmed: false, // Default to not confirmed
            reminder_sent: false, // Default to not sent
          })
          .select(`
            apt_id,
            client_id,
            appointment_at,
            clients:client_id (
              id,
              name,
              phone
            )
          `)
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
          prev.map((apt) => (apt.id === newAppointment.id ? convertedAppointment : apt))
        );
      } catch (err) {
        console.error('Error saving appointment to Supabase:', err);
        setError(err.message || 'Failed to save appointment');
        // Remove optimistic update on error
        setAppointments((prev) => prev.filter((apt) => apt.id !== newAppointment.id));
        throw err; // Re-throw so UI can handle it
      }
    }
  };

  // Send SMS reminder for an appointment
  const sendReminder = async (appointmentId) => {
    const { sendSMSReminder } = await import('../lib/smsService');
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
      sendReminder,
      loading,
      error,
      supabaseEnabled,
      refreshAppointments: loadAppointments,
    }),
    [appointments, loading, error, supabaseEnabled]
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
};
