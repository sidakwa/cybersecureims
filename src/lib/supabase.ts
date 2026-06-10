import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Copy .env.example to .env and fill in the values.');
}

if (import.meta.env.DEV) {
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('🔧 Anon key present:', !!supabaseAnonKey);
}

// Create client with more verbose logging
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: { 'x-application-name': 'cybersecureims' },
  },
});

// Add a test function to verify connection
export const testSupabaseConnection = async () => {
  try {
    if (import.meta.env.DEV) {
      console.log('🔍 Testing Supabase connection...');
    }
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    if (import.meta.env.DEV) {
      console.log('✅ Connection test successful');
    }
    return true;
  } catch (err) {
    console.error('💥 Connection test exception:', err);
    return false;
  }
};

// Export the client and helpers
export const isDemoMode = false;

export const signInWithAzure = async () => {
  try {
    const redirectTo = `${window.location.origin}/auth/callback`;
    if (import.meta.env.DEV) {
      console.log('Azure SSO redirect to:', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo,
        scopes: 'email openid profile User.Read offline_access',
        queryParams: { tenant: import.meta.env.VITE_AZURE_TENANT_ID }
      }
    });
    
    if (error) {
      console.error('Azure SSO error:', error);
      throw error;
    }
    
    if (import.meta.env.DEV) {
    
      console.log('Azure SSO initiated');
    
    }
    return data;
  } catch (error) {
    console.error('Azure SSO exception:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Email login error:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Make supabase available globally for debugging in development only
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugSupabase = supabase;
  (window as any).testConnection = testSupabaseConnection;
  console.log('🐛 Debug: window.debugSupabase and window.testConnection available');
}
