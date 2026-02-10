import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginAsBeta: (role: UserRole) => void;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch user profile from public.users table
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist yet (e.g. race condition on signup), 
        // we might handle it or wait. For now, log it.
        return;
      }

      if (data) {
        setUser(data as User);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // If we switched users or just signed in
        if (session.user.id !== user?.id) {
          setIsLoading(true); // Set loading while fetching profile
          fetchProfile(session.user.id, session.user.email!);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<string | null> => {
    setIsLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.user) {
      console.error('Login error:', error);
      setIsLoading(false);
      return null;
    }

    // Fetch profile directly to get role
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profile) {
      setUser(profile as User);
      setIsLoading(false);
      return profile.role;
    }

    setIsLoading(false);
    return null;
  };

  const loginAsBeta = (role: UserRole) => {
    const betaNames: Record<UserRole, string> = {
      admin: 'Admin Beta',
      seller: 'Seller Beta',
      closer: 'Closer Beta',
      client: 'Cliente Beta',
    };
    setUser({
      id: `beta-${role}`,
      email: `${role}@beta.local`,
      name: betaNames[role],
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User);
    setIsLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);

    // 1. Sign up in Supabase Auth
    // The DB trigger `handle_new_user` will auto-create the public.users profile
    // using name/role from raw_user_meta_data
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role // Stored in raw_user_meta_data, used by trigger
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Registration error:', authError);
      toast.error(`Erro no cadastro: ${authError?.message}`);
      setIsLoading(false);
      return false;
    }

    // 2. Try to upsert profile (trigger may have already created it)
    const { error: profileError } = await supabase
      .from('users')
      .upsert([{
        id: authData.user.id,
        email,
        name,
        role,
      }], { onConflict: 'id' });

    if (profileError) {
      // Not fatal — trigger should have created it already
      console.warn('Manual profile upsert failed (trigger likely handled it):', profileError.message);
    }

    toast.success('Conta criada com sucesso!');
    setIsLoading(false);
    return true;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginAsBeta,
        logout,
        register,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
