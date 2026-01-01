import { supabase } from './supabase';

/**
 * Send SMS reminder for an appointment
 * @param {string} appointmentId - The appointment ID
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const sendSMSReminder = async (appointmentId) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms-reminder', {
      body: { appointmentId }
    });

    if (error) {
      throw error;
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error sending SMS reminder:', error);
    return { success: false, message: error.message || 'Failed to send SMS reminder' };
  }
};