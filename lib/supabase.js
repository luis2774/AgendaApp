import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from environment
// For Expo: Use EXPO_PUBLIC_ prefix for client-side env vars
// Or set in app.json under "extra" field
const getSupabaseConfig = () => {
  // Method 1: Try Constants.expoConfig.extra (from app.json)
  const fromExtra = Constants.expoConfig?.extra;
  if (fromExtra?.supabaseUrl && fromExtra?.supabaseAnonKey) {
    return {
      url: fromExtra.supabaseUrl,
      key: fromExtra.supabaseAnonKey,
    };
  }

  // Method 2: Try EXPO_PUBLIC_ prefixed vars (Expo standard for client-side)
  if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY) {
    return {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      key: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    };
  }

  // Method 3: Try non-prefixed vars (for compatibility)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY,
    };
  }

  // Method 4: Fallback - return empty strings (will show error)
  console.warn(
    '⚠️ Supabase credentials not found!\n' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your .env file.\n' +
    'Or add to app.json under "extra" field as supabaseUrl and supabaseAnonKey.'
  );
  return {
    url: '',
    key: '',
  };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

// Validate that we have the required credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase credentials not found!\n' +
    'Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.\n' +
    'See .env.example for reference.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export config for checking if Supabase is enabled
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Test connection (optional - can be removed in production)
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('appointments').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

