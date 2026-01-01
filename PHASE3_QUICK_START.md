# Phase 3 Quick Start Checklist

## ✅ What's Been Created

1. **Edge Function Code**: `supabase/functions/send-sms-reminder/index.ts`
2. **Setup Guide**: `SUPABASE_EDGE_FUNCTION_SETUP.md`

## 🚀 Quick Start Steps

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login and Link Project
```bash
# Login
supabase login

# Link to your project (get PROJECT_REF from Supabase Dashboard > Settings > General)
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set Twilio Secrets
```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Deploy Function
```bash
supabase functions deploy send-sms-reminder
```

### 5. Test (Optional)
```bash
# Test locally first
supabase functions serve send-sms-reminder

# Then test deployed function
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "test-appointment-id"}'
```

## 📝 Notes

- **Function URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms-reminder`
- **Required Secret**: Twilio credentials are automatically injected as environment variables
- **Supabase Secrets**: Automatically available (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

## 🔍 Find Your Project Reference ID

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings > General
4. Copy "Reference ID"

## 🔍 Find Your Anon Key

1. Supabase Dashboard
2. Settings > API
3. Copy "anon public" key

## ⚠️ Common Issues

- **CLI not found**: Restart terminal after installing
- **Not logged in**: Run `supabase login`
- **Function not found**: Make sure you're in project root
- **Secrets not working**: Verify with `supabase secrets list`

## 📚 Full Documentation

See `SUPABASE_EDGE_FUNCTION_SETUP.md` for detailed instructions and troubleshooting.

