import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  role: string;
  full_name: string;
  organization_id: string;
  avatar_url?: string;
  created_at?: string;
};

type Organization = {
  id: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  organizationId: string | null;
  role: string;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Non-blocking profile fetch - runs in background
  const fetchProfileInBackground = async (userId: string) => {
    try {
      console.log('🔍 Background fetch for profile:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError.message);
        return;
      }
      
      if (!profileData) {
        console.error('❌ No profile found');
        return;
      }
      
      console.log('✅ Profile loaded in background:', profileData.role);
      setProfile(profileData);
      
      // Fetch organization if exists
      if (profileData.organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', profileData.organization_id)
          .maybeSingle();
        
        if (!orgError && org) {
          console.log('✅ Organization loaded:', org.name);
          setOrganization(org);
        }
      }
    } catch (err) {
      console.error('💥 Background fetch error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing AuthProvider...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('📊 Session user:', session?.user?.email || 'none');
        
        if (isMounted) {
          setUser(session?.user ?? null);
          
          // Non-blocking: Set loading false immediately, fetch profile in background
          setLoading(false);
          
          if (session?.user) {
            // Fetch profile in background without blocking UI
            fetchProfileInBackground(session.user.id);
          }
        }
      } catch (err) {
        console.error('❌ Auth error:', err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event);
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          fetchProfileInBackground(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setOrganization(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileInBackground(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setLoading(false);
  };

  const role = profile?.role || 'viewer';
  const isAdmin = role === 'admin';

  console.log('📊 Auth state - loading:', loading, 'user:', user?.email, 'role:', role);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        organizationId: profile?.organization_id ?? null,
        role,
        isAdmin,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
