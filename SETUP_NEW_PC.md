# Setting Up Project on a Different PC

This guide will help you set up the AgendaTest project on a new computer.

---

## Prerequisites

### 1. Install Required Software

#### Node.js (v18 or higher recommended)
- Download from: https://nodejs.org/
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### Git (if using version control)
- Download from: https://git-scm.com/downloads
- Verify installation:
  ```bash
  git --version
  ```

#### Expo CLI (for React Native/Expo projects)
```bash
npm install -g expo-cli
# OR use npx (recommended, no global install needed)
# npx expo start
```

#### Supabase CLI (only if deploying/managing Edge Functions)
```bash
npm install -g supabase
# Verify installation
supabase --version
```

#### Code Editor (optional but recommended)
- VS Code: https://code.visualstudio.com/
- Recommended extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

---

## Step 1: Get Your Project Files

### Option A: Using Git (Recommended if using version control)
```bash
# Clone your repository
git clone <your-repository-url>
cd AgendaTest

# Or if already have a repo, pull latest changes
git pull origin main
```

### Option B: Copy Files Manually
1. Copy the entire project folder from your old PC
2. Transfer via USB drive, cloud storage (OneDrive, Google Drive), or network share

---

## Step 2: Install Dependencies

Navigate to your project directory and install all required packages:

```bash
cd AgendaTest
npm install
```

This will install all packages listed in `package.json`.

**Note:** If you encounter issues, try:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# On Windows, use:
rmdir /s node_modules
npm install
```

---

## Step 3: Set Up Environment Variables

Create a `.env` file in the project root directory.

### Create `.env` File

Create a new file named `.env` in the root of your project (same level as `package.json`):

```bash
# On Windows (PowerShell)
New-Item .env -ItemType File

# On Mac/Linux
touch .env
```

### Add Your Supabase Credentials

Open the `.env` file and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find your Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Important:**
- The `.env` file is in `.gitignore` and should **NOT** be committed to git
- Keep your credentials secure and never share them publicly
- If you're using a team, share credentials securely (use password managers or secure channels)

---

## Step 4: Verify Project Structure

Ensure you have these key files/folders:

```
AgendaTest/
├── .env                    # Environment variables (create this)
├── package.json            # Dependencies
├── app.json                # Expo configuration
├── App.js                  # Main app entry
├── lib/
│   ├── supabase.js        # Supabase client
│   └── smsService.js      # SMS service
├── screens/                # Screen components
├── context/                # Context providers
├── components/             # Reusable components
└── supabase/
    └── functions/          # Edge Functions (if using)
```

---

## Step 5: Configure Supabase CLI (Optional - Only for Edge Functions)

If you need to deploy or manage Supabase Edge Functions:

### 5.1: Login to Supabase
```bash
supabase login
```

### 5.2: Link to Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your Project Reference ID:**
1. Go to Supabase Dashboard
2. Settings > General
3. Copy the "Reference ID"

### 5.3: Set Edge Function Secrets (if using SMS functionality)
```bash
# These are stored in Supabase, not locally
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** Secrets are stored in your Supabase project, so they're available to all team members with access.

---

## Step 6: Run the Project

### Start the Expo Development Server
```bash
# Clear cache (recommended for fresh install)
npx expo start --clear

# Or without clearing cache
npm start
# OR
npx expo start
```

### Test the App

1. **On Your Phone (Recommended):**
   - Install "Expo Go" app (iOS App Store or Google Play)
   - Scan the QR code shown in the terminal
   - The app will load on your device

2. **On Emulator/Simulator:**
   ```bash
   # For iOS (Mac only)
   npx expo start --ios
   
   # For Android
   npx expo start --android
   ```

3. **In Web Browser:**
   ```bash
   npx expo start --web
   ```

---

## Troubleshooting

### Issue: "Supabase credentials not found"
**Solution:** 
- Verify your `.env` file exists in the project root
- Check that variable names match exactly: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo with `--clear` flag: `npx expo start --clear`

### Issue: "Module not found" errors
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: "Metro bundler cache" errors
**Solution:**
```bash
npx expo start --clear
```

### Issue: Port already in use
**Solution:**
- Close other Expo/React Native processes
- Or use a different port: `npx expo start --port 8082`

### Issue: "Cannot connect to Supabase"
**Solution:**
- Verify your `.env` file has correct credentials
- Check your internet connection
- Verify Supabase project is active in dashboard
- Check if there are any firewall/network restrictions

---

## Quick Checklist

Before you start coding, verify:

- [ ] Node.js installed (`node --version`)
- [ ] Project files copied/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with Supabase credentials
- [ ] App starts successfully (`npx expo start`)
- [ ] App connects to Supabase (no credential errors)
- [ ] (Optional) Supabase CLI linked if using Edge Functions

---

## What Gets Synced vs. What Stays Local

### ✅ Synced (if using Git):
- All source code (`screens/`, `context/`, `components/`, etc.)
- Configuration files (`package.json`, `app.json`, `babel.config.js`)
- Edge Function code (`supabase/functions/`)

### ❌ NOT Synced (stays local):
- `.env` file (contains secrets - should NOT be committed)
- `node_modules/` folder (reinstall with `npm install`)
- `.expo/` folder (build cache - regenerated)
- Platform-specific builds (`ios/`, `android/`)

### 🔐 Stored in Supabase Dashboard:
- Edge Function secrets (accessible via Supabase CLI)
- Database credentials (accessed via `.env` on each machine)

---

## Team Collaboration Tips

If working with a team:

1. **Share `.env.example`:**
   Create a `.env.example` file (committed to git) showing required variables:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-url-here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key-here
   ```

2. **Document Setup:**
   Keep this `SETUP_NEW_PC.md` file updated with any new requirements

3. **Use Password Managers:**
   Share sensitive credentials via secure password managers (1Password, LastPass, etc.)

4. **Supabase Access:**
   Grant team members access to the Supabase project via the dashboard

---

## Next Steps

Once everything is set up:

1. ✅ Verify the app connects to Supabase
2. ✅ Test creating/viewing appointments
3. ✅ Test client management
4. ✅ (Optional) Test SMS reminders if Edge Functions are deployed

Happy coding! 🚀

