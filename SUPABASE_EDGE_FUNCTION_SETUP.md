# Supabase Edge Function Setup Guide - Phase 3

This guide will help you set up the Supabase Edge Function for sending SMS reminders via Twilio.

## Prerequisites

1. ✅ Supabase project created (you already have this)
2. ✅ Twilio account with credentials (from Phase 1)
3. ⚠️ Supabase CLI installed (we'll do this next)

---

## Step 1: Install Supabase CLI

### Option A: Using npm (Recommended)
```bash
npm install -g supabase
```

### Option B: Using Scoop (Windows)
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option C: Using Chocolatey (Windows)
```powershell
choco install supabase
```

### Option D: Download Binary
Download from: https://github.com/supabase/cli/releases

After installation, verify:
```bash
supabase --version
```

---

## Step 2: Login to Supabase

Link your local project to your Supabase project:

```bash
# Login to Supabase
supabase login

# Link to your project (you'll need your project reference ID from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your Project Reference ID:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings > General
4. Copy the "Reference ID" (it's in the format: `abcdefghijklmnop`)

---

## Step 3: Verify Edge Function Structure

The Edge Function file has been created at:
```
supabase/functions/send-sms-reminder/index.ts
```

Verify it exists:
```bash
# List functions
supabase functions list
```

---

## Step 4: Set Function Secrets (Environment Variables)

Set your Vonage credentials as secrets. **Never commit these to git!**

```bash
# Set Vonage API Key
supabase secrets set VONAGE_API_KEY=your_api_key_here

# Set Vonage API Secret
supabase secrets set VONAGE_API_SECRET=your_api_secret_here

# Set Vonage Phone Number (include + and country code, e.g., +1234567890)
supabase secrets set VONAGE_PHONE_NUMBER=+1234567890
```

**To get your Vonage credentials:**
1. Go to Vonage Dashboard: https://dashboard.nexmo.com (or https://dashboard.vonage.com)
2. Sign up or log in to your account
3. Go to Settings (gear icon) > API Credentials
4. Copy your API Key and API Secret
5. For phone numbers, go to Numbers > Your Numbers (or purchase a new number)

**Note:** Supabase automatically provides:
- `SUPABASE_URL` (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically set)

---

## Step 5: Test Locally (Optional but Recommended)

Test the function locally before deploying:

```bash
# Serve functions locally
supabase functions serve send-sms-reminder

# In another terminal, test with curl
curl -X POST http://localhost:54321/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id-here"}'
```

**To get your Anon Key:**
1. Go to Supabase Dashboard
2. Settings > API
3. Copy the "anon public" key

---

## Step 6: Deploy the Edge Function

Once everything is set up, deploy to Supabase:

```bash
# Deploy the function
supabase functions deploy send-sms-reminder

# Or deploy all functions
supabase functions deploy
```

After deployment, you should see output like:
```
Deploying send-sms-reminder (project ref: xxxxxx)
Deployed Function send-sms-reminder!
```

---

## Step 7: Verify Deployment

1. Go to your Supabase Dashboard
2. Navigate to: Edge Functions > send-sms-reminder
3. You should see the function listed
4. Check the logs to ensure no errors

---

## Step 8: Test the Deployed Function

Test the deployed function using your Supabase project URL:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id-here"}'
```

Replace:
- `YOUR_PROJECT_REF` with your actual project reference ID
- `YOUR_ANON_KEY` with your anon/public key
- `your-appointment-id-here` with an actual appointment ID from your database

---

## Troubleshooting

### Issue: "supabase: command not found"
**Solution:** Make sure Supabase CLI is installed and in your PATH. Restart your terminal after installation.

### Issue: "Not logged in"
**Solution:** Run `supabase login` and follow the authentication flow.

### Issue: "Project not linked"
**Solution:** Run `supabase link --project-ref YOUR_PROJECT_REF`

### Issue: "Function deployment failed"
**Solution:** 
- Check that `supabase/functions/send-sms-reminder/index.ts` exists
- Verify you're in the project root directory
- Check Supabase Dashboard for error logs

### Issue: "Vonage credentials not configured"
**Solution:** Make sure you've set all three secrets:
```bash
supabase secrets set VONAGE_API_KEY=...
supabase secrets set VONAGE_API_SECRET=...
supabase secrets set VONAGE_PHONE_NUMBER=...
```

### Issue: "Invalid phone number format"
**Solution:** Phone numbers must be in E.164 format (e.g., `+1234567890`). Make sure client phone numbers in your database include country code.

### Issue: Function works locally but not deployed
**Solution:**
- Check that secrets are set in the deployed environment (not just local)
- Verify function logs in Supabase Dashboard
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available (they should be auto-set)

---

## Next Steps

Once the Edge Function is deployed and tested:

1. ✅ Proceed to **Phase 4**: Frontend Integration
2. Create the SMS service helper in `lib/smsService.js`
3. Update AppointmentsContext to call the function
4. Add UI elements to trigger SMS sending

---

## Alternative: Manual Deployment via Dashboard

If you prefer not to use the CLI, you can:

1. Go to Supabase Dashboard > Edge Functions
2. Click "Create a new function"
3. Name it `send-sms-reminder`
4. Copy the code from `supabase/functions/send-sms-reminder/index.ts`
5. Paste it into the editor
6. Save and deploy

However, using the CLI is recommended for easier secret management and version control.

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit secrets to git
- Never expose TWILIO_AUTH_TOKEN in client-side code
- Always use Edge Functions or backend services for Twilio API calls
- Use Supabase secrets management (not environment variables in code)
- The SERVICE_ROLE_KEY has admin access - it's automatically provided by Supabase for Edge Functions

