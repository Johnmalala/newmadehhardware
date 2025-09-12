import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

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

  useEffect(() => {
    const fetchAdminProfile = async (email: string) => {
      try {
        const { data: adminProfile, error } = await supabase
          .from('admins')
          .select('*')
          .eq('username', email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin profile:', error);
          setAdmin(null);
        } else {
          setAdmin(adminProfile);
        }
      } catch (e) {
        console.error('An unexpected error occurred while fetching admin profile:', e);
        setAdmin(null);
      }
    };
    
    // onAuthStateChange handles the initial session check and any subsequent changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        await fetchAdminProfile(session.user.email);
      } else {
        setAdmin(null);
      }
      setLoading(false);
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
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
