import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminProfile = async (userId: string) => {
    try {
      const { data: adminProfile, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching admin profile:', error.message);
        setAdmin(null);
      } else {
        setAdmin(adminProfile);
      }
    } catch (e) {
      console.error('An unexpected error occurred while fetching admin profile:', e);
      setAdmin(null);
    }
  };

  const refreshAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchAdminProfile(session.user.id);
    }
  };

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAdminProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAdminProfile(session.user.id);
      } else {
        setAdmin(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, refreshAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
