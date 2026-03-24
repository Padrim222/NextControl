import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.id !== user?.id) {
          setIsLoading(true);
          fetchProfile(session.user.id);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      if (data) setUser(data as User);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    if (!supabase) { toast.error('Supabase não conectado'); return null; }
    setIsLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !authData.user) {
      setIsLoading(false);
      return null;
    }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    if (profile) {
      setUser(profile as User);
      setIsLoading(false);
      return profile.role;
    }
    setIsLoading(false);
    return null;
  };



  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    window.location.replace('/');
  };

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    if (!supabase) { toast.error('Supabase não conectado'); return false; }
    setIsLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: { name, role } }
    });
    if (authError || !authData.user) {
      toast.error(`Erro no cadastro: ${authError?.message}`);
      setIsLoading(false);
      return false;
    }
    await supabase.from('users').upsert([{ id: authData.user.id, email, name, role }], { onConflict: 'id' });
    toast.success('Conta criada com sucesso!');
    setIsLoading(false);
    return true;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    return (Array.isArray(roles) ? roles : [roles]).includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, register, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
