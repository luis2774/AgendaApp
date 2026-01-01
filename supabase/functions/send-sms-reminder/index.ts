// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import twilio from "npm:twilio@^4.19.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appointmentId } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get appointment with client info
    const { data: appointment, error: aptError } = await supabaseClient
      .from('appointments')
      .select(`
        apt_id,
        appointment_at,
        client_id,
        reminder_sent,
        clients:client_id (
          id,
          name,
          phone
        )
      `)
      .eq('apt_id', appointmentId)
      .single()

    if (aptError || !appointment) {
      throw new Error('Appointment not found')
    }

    if (!appointment.clients?.phone) {
      throw new Error('Client phone number not found')
    }

    if (appointment.reminder_sent) {
      return new Response(
        JSON.stringify({ message: 'Reminder already sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Initialize Twilio client
    const twilioClient = twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN')
    )

    // Format appointment date/time
    const aptDate = new Date(appointment.appointment_at)
    const formattedDate = aptDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = aptDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Hi ${appointment.clients.name}, this is a reminder that you have an appointment on ${formattedDate} at ${formattedTime}.`,
      from: Deno.env.get('TWILIO_PHONE_NUMBER'),
      to: appointment.clients.phone
    })

    // Update appointment to mark reminder as sent
    await supabaseClient
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('apt_id', appointmentId)

    return new Response(
      JSON.stringify({ success: true, messageSid: message.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-sms-reminder' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
