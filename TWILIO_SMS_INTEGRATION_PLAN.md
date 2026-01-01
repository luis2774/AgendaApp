# Twilio SMS Reminder Integration Plan

## Overview
This plan outlines the steps to integrate Twilio SMS functionality to send appointment reminders to clients.

## Architecture Considerations

### Important: Backend Required
**Twilio credentials (Account SID, Auth Token) should NEVER be stored in the mobile app.** You'll need a backend service to handle SMS sending. Options:

1. **Supabase Edge Functions** (Recommended if using Supabase)
   - Serverless functions that can securely call Twilio API
   - Integrated with your existing Supabase setup

2. **Separate Backend Service**
   - Node.js/Express server
   - Python/Flask server
   - Any serverless function platform (Vercel, Netlify, AWS Lambda)

3. **Twilio Functions**
   - Twilio's serverless platform
   - Requires restructuring your flow

**For this plan, we'll assume using Supabase Edge Functions** (recommended for your setup).

---

## Phase 1: Twilio Account Setup

### Step 1.1: Create Twilio Account
1. Sign up at https://www.twilio.com
2. Verify your phone number
3. Get a Twilio phone number (trial accounts have limitations)
4. Note your credentials:
   - Account SID
   - Auth Token
   - Phone Number (e.g., +1234567890)

### Step 1.2: Install Twilio SDK (Backend)
```bash
# In your backend/Supabase Edge Function
npm install twilio
```

### Step 1.3: Store Credentials Securely
- Store Twilio credentials as environment variables (never in code)
- In Supabase: Project Settings > Edge Functions > Secrets
- Add secrets:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

---

## Phase 2: Database Schema Updates

### Step 2.1: Verify Current Schema
Your `appointments` table should already have:
- `reminder_sent` (boolean) - tracks if reminder was sent
- `reminder_at` (timestamp) - when to send reminder

If not, add these columns:
```sql
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE;
```

### Step 2.2: Add Client Phone Number
Ensure `clients` table has `phone` column (you already have this).

---

## Phase 3: Supabase Edge Function Setup

### Step 3.1: Create Edge Function Structure
```bash
# In your project root
supabase functions new send-sms-reminder
```

### Step 3.2: Edge Function Code
Create `supabase/functions/send-sms-reminder/index.ts`:

```typescript
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
```

### Step 3.3: Deploy Edge Function
```bash
supabase functions deploy send-sms-reminder
```

### Step 3.4: Set Function Secrets
```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

---

## Phase 4: Frontend Integration

### Step 4.1: Create SMS Service Helper
Create `lib/smsService.js`:

```javascript
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
```

### Step 4.2: Update AppointmentsContext
Add function to send reminders and refresh appointment list:

```javascript
// In AppointmentsContext.js
const sendReminder = async (appointmentId) => {
  const { sendSMSReminder } = await import('../lib/smsService');
  const result = await sendSMSReminder(appointmentId);
  
  if (result.success) {
    // Refresh appointments to get updated reminder_sent status
    await loadAppointments();
  }
  
  return result;
};
```

---

## Phase 5: Scheduling Reminders

### Option A: Manual Send (Easier to implement)
Add a "Send Reminder" button in AppointmentDetails screen.

### Option B: Automatic Scheduling (More complex)
Use a cron job or scheduled function to check for appointments that need reminders.

**For Supabase Edge Functions with pg_cron:**
```sql
-- Create a function to check and send reminders
CREATE OR REPLACE FUNCTION check_and_send_reminders()
RETURNS void AS $$
DECLARE
  apt RECORD;
BEGIN
  -- Find appointments that need reminders
  FOR apt IN
    SELECT apt_id, appointment_at, client_id
    FROM appointments
    WHERE reminder_sent = FALSE
      AND reminder_at <= NOW()
      AND appointment_at > NOW() -- Only future appointments
  LOOP
    -- Call your edge function (requires HTTP extension)
    -- This is a simplified version - actual implementation needs HTTP client
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-sms-reminder',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := json_build_object('appointmentId', apt.apt_id)::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every hour
SELECT cron.schedule(
  'send-sms-reminders',
  '0 * * * *', -- Every hour
  $$SELECT check_and_send_reminders()$$
);
```

**Note:** Automatic scheduling requires:
- Supabase Pro plan (for pg_cron)
- Or external cron service (cron-job.org, EasyCron, etc.)

---

## Phase 6: UI Updates

### Step 6.1: Update AppointmentDetails Screen
Add "Send Reminder" button:

```javascript
// In AppointmentDetails.js
const { sendReminder } = useAppointments();
const [sendingReminder, setSendingReminder] = useState(false);

const handleSendReminder = async () => {
  if (!event.client_id || !event.clients?.phone) {
    Alert.alert("Error", "Client phone number not available");
    return;
  }

  if (event.reminder_sent) {
    Alert.alert("Already Sent", "Reminder has already been sent for this appointment");
    return;
  }

  setSendingReminder(true);
  const result = await sendReminder(event.id);
  setSendingReminder(false);

  if (result.success) {
    Alert.alert("Success", "SMS reminder sent successfully!");
  } else {
    Alert.alert("Error", result.message || "Failed to send reminder");
  }
};

// In JSX, add button:
<TouchableOpacity
  style={[styles.reminderButton, (event.reminder_sent || sendingReminder) && styles.reminderButtonDisabled]}
  onPress={handleSendReminder}
  disabled={event.reminder_sent || sendingReminder}
>
  <Text style={styles.reminderButtonText}>
    {event.reminder_sent ? "Reminder Sent ✓" : sendingReminder ? "Sending..." : "Send SMS Reminder"}
  </Text>
</TouchableOpacity>
```

### Step 6.2: Update Appointment Card (HomeScreen)
Show reminder status badge if reminder was sent.

---

## Phase 7: Testing

### Step 7.1: Test Twilio Setup
1. Test sending SMS manually via Twilio console
2. Verify phone number formatting (must include country code, e.g., +1 for US)
3. Check Twilio logs for delivery status

### Step 7.2: Test Edge Function
```bash
# Test locally
supabase functions serve send-sms-reminder --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id"}'
```

### Step 7.3: Test Full Flow
1. Create an appointment with a client that has a phone number
2. Navigate to appointment details
3. Click "Send SMS Reminder"
4. Verify SMS is received
5. Verify `reminder_sent` is updated in database

---

## Phase 8: Error Handling & Edge Cases

### Considerations:
1. **Invalid phone numbers**: Validate format before sending
2. **Twilio errors**: Handle rate limits, invalid numbers, etc.
3. **Retry logic**: Implement retry for failed sends
4. **Cost tracking**: Monitor Twilio usage
5. **Trial account limits**: Be aware of Twilio trial restrictions

### Phone Number Validation:
Add validation in Edge Function:
```javascript
// Validate phone number format (E.164 format)
const phoneRegex = /^\+[1-9]\d{1,14}$/;
if (!phoneRegex.test(appointment.clients.phone)) {
  throw new Error('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)');
}
```

---

## Phase 9: Production Considerations

### Step 9.1: Twilio Production Setup
1. Upgrade from trial account
2. Purchase dedicated phone number
3. Set up billing alerts
4. Configure webhooks for delivery status

### Step 9.2: Monitoring
- Set up logging for SMS sends
- Track success/failure rates
- Monitor Twilio usage dashboard

### Step 9.3: Rate Limiting
- Implement rate limiting to prevent abuse
- Add delays between batch sends
- Respect Twilio rate limits

---

## Estimated Implementation Time

- **Phase 1-2**: 30 minutes (Twilio setup + schema verification)
- **Phase 3**: 2-3 hours (Edge Function setup and testing)
- **Phase 4**: 1-2 hours (Frontend integration)
- **Phase 5**: 2-4 hours (Scheduling - optional, depends on approach)
- **Phase 6**: 1-2 hours (UI updates)
- **Phase 7**: 1-2 hours (Testing)
- **Phase 8-9**: 1-2 hours (Error handling and production setup)

**Total: 8-16 hours** (depending on scheduling approach and testing depth)

---

## Alternative: Simpler Approach (No Backend)

If you want to test quickly without a backend, you could:
1. Use Twilio's WhatsApp API (if applicable)
2. Use a third-party service like Courier, SendGrid, etc.
3. Use Supabase's built-in email functionality instead

**However, for production SMS, a backend is strongly recommended for security.**

---

## Next Steps

1. ✅ Review this plan
2. Set up Twilio account
3. Decide on scheduling approach (manual vs automatic)
4. Start with Phase 1-3 (backend setup)
5. Test with one appointment
6. Implement frontend integration
7. Add scheduling if needed
8. Production deployment

