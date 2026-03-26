import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    // Safety timeout: never stay loading forever (8s max)
    timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('[Auth] Loading timeout reached — forcing ready state');
        setIsLoading(false);
      }
    }, 8000);

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error initializing auth:', error);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Detect if running on Lovable infrastructure (where /~oauth routes exist)
  const isLovableHost =
    window.location.hostname.endsWith('.lovable.app') ||
    window.location.hostname.endsWith('.lovableproject.com');

  async function signInWithGoogle() {
    // Always use managed Lovable OAuth on *.lovable.app domains
    if (isLovableHost) {
      try {
        const { lovable } = await import('@/integrations/lovable/index');
        const result = await lovable.auth.signInWithOAuth('google', {
          redirect_uri: window.location.origin,
        });
        if (result.error) throw result.error;
      } catch (err) {
        console.error('Lovable OAuth error:', err);
        throw err;
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
        },
      });
      if (error) throw error;
    }
  }

  async function signInWithApple() {
    if (isLovableHost) {
      try {
        const { lovable } = await import('@/integrations/lovable/index');
        const result = await lovable.auth.signInWithOAuth('apple', {
          redirect_uri: window.location.origin,
        });
        if (result.error) throw result.error;
      } catch (err) {
        console.error('Lovable OAuth error:', err);
        throw err;
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/auth',
        },
      });
      if (error) throw error;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
