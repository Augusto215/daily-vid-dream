import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || '',
          display_name: name || email.split('@')[0],
        }
      }
    });

    // Se o usuário foi criado com sucesso, mas ainda não confirmou o email
    // Vamos tentar criar o perfil manualmente como backup
    if (data.user && !error) {
      try {
        await createUserProfile(data.user.id, name || email.split('@')[0], email);
      } catch (profileError) {
        // Se falhar, não é crítico pois o trigger deve cuidar disso
        console.log('Profile creation handled by trigger or will be created on confirmation');
      }
    }

    return { data, error };
  };

  const createUserProfile = async (userId: string, name: string, email: string) => {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          name: name,
          email: email,
        }
      ]);

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    createUserProfile,
    isAuthenticated: !!user,
  };
};
