import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const getProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se o perfil não existe, tenta criar um
        if (error.code === 'PGRST116') {
          await ensureUserProfile();
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureUserProfile = async () => {
    if (!user) return;

    try {
      const name = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário';
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            name: name,
            email: user.email || '',
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    ensureUserProfile,
    refreshProfile: getProfile,
  };
};
