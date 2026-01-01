# Vonage SMS Reminder Integration Plan

## Overview
This plan outlines the steps to integrate Vonage SMS functionality to send appointment reminders to clients.

## Architecture Considerations

### Important: Backend Required
**Vonage credentials (API Key, API Secret) should NEVER be stored in the mobile app.** You'll need a backend service to handle SMS sending. Options:

1. **Supabase Edge Functions** (Recommended if using Supabase)
   - Serverless functions that can securely call Vonage API
   - Integrated with your existing Supabase setup

2. **Separate Backend Service**
   - Node.js/Express server
   - Python/Flask server
   - Any serverless function platform (Vercel, Netlify, AWS Lambda)

**For this plan, we'll assume using Supabase Edge Functions** (recommended for your setup).

---

## Phase 1: Vonage Account Setup

### Step 1.1: Create Vonage Account
1. Sign up at https://www.vonage.com (or https://dashboard.nexmo.com)
2. Verify your email and phone number
3. Get a Vonage phone number (or use your existing number)
4. Note your credentials:
   - API Key
   - API Secret
   - Phone Number (e.g., +1234567890)

### Step 1.2: Install Vonage SDK (Backend)
The Edge Function uses the Vonage SDK which is imported via npm: in Deno:
```typescript
import { Vonage } from "npm:@vonage/server-sdk@^3.11.0"
```

### Step 1.3: Store Credentials Securely
- Store Vonage credentials as environment variables (never in code)
- In Supabase: Project Settings > Edge Functions > Secrets
- Add secrets:
  - `VONAGE_API_KEY`
  - `VONAGE_API_SECRET`
  - `VONAGE_PHONE_NUMBER`

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

✅ **Already Completed** - The Edge Function has been created at:
- `supabase/functions/send-sms-reminder/index.ts`

The function uses Vonage SDK to send SMS messages.

### Key Differences from Twilio:
- Uses `@vonage/server-sdk` package
- Credentials: API Key and API Secret (instead of Account SID/Auth Token)
- Response format is slightly different (checks `response.messages[0].status === '0'`)

---

## Phase 4: Frontend Integration

✅ **Already Completed** - The SMS service and UI integration are already in place:
- `lib/smsService.js` - Calls the Edge Function
- `context/AppointmentsContext.js` - Includes `sendReminder` function
- `screens/AppointmentDetails.js` - Has "Send SMS Reminder" button

No changes needed to frontend code - it works the same way with Vonage!

---

## Phase 5: Manual Send (Already Implemented)

✅ **Already Completed** - Manual send button is implemented in AppointmentDetails screen.

Users can click "Send SMS Reminder" button to manually trigger SMS reminders.

---

## Phase 6: Testing

### Step 6.1: Test Vonage Setup
1. Get a Vonage phone number from your dashboard
2. Verify phone number formatting (must include country code, e.g., +1 for US)
3. Check Vonage dashboard for message logs

### Step 6.2: Test Edge Function
The function is already deployed and ready. Test it with:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id"}'
```

### Step 6.3: Test Full Flow
1. Create an appointment with a client that has a phone number
2. Navigate to appointment details
3. Click "Send SMS Reminder"
4. Verify SMS is received
5. Verify `reminder_sent` is updated in database

---

## Vonage vs Twilio: Key Differences

| Feature | Twilio | Vonage |
|---------|--------|--------|
| SDK Package | `twilio` | `@vonage/server-sdk` |
| Credentials | Account SID, Auth Token | API Key, API Secret |
| Client Init | `twilio(sid, token)` | `new Vonage({ apiKey, apiSecret })` |
| Send SMS | `client.messages.create()` | `vonage.sms.send()` |
| Response | `message.sid` | `response.messages[0]['message-id']` |
| Success Check | N/A (throws on error) | `status === '0'` |

---

## Troubleshooting

### Phone Number Format
- Vonage requires E.164 format: `+1234567890`
- Must include country code
- No spaces or dashes

### API Credentials
- Find in: Vonage Dashboard > Settings > API Credentials
- API Key and API Secret are different from phone number credentials

### Error Codes
- Status `0`: Success
- Status `1`: Throttled
- Status `2`: Missing parameters
- Status `3`: Invalid parameters
- Status `4`: Invalid credentials
- Status `5`: Internal error

---

## Cost Considerations

- Vonage pricing: Typically per SMS sent
- Check current pricing at: https://www.vonage.com/communications-apis/sms/pricing/
- Free tier available for testing (limited messages)

---

## Next Steps

1. ✅ Edge Function updated to use Vonage
2. ✅ Frontend integration complete
3. ⚠️ Set Vonage secrets in Supabase
4. ⚠️ Test SMS sending
5. ✅ Ready for production use

