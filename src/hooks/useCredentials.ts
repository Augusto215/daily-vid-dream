import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserCredentials {
  id?: string;
  user_id?: string;
  open_ai_api_key: string | null;
  eleven_labs_api_key: string | null;
  youtube_api_key: string | null;
  drive_client_id: string | null;
  drive_client_secret: string | null;
  drive_api_key: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useCredentials = () => {
  const [credentials, setCredentials] = useState<UserCredentials>({
    open_ai_api_key: null,
    eleven_labs_api_key: null,
    youtube_api_key: null,
    drive_client_id: null,
    drive_client_secret: null,
    drive_api_key: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setCredentials({
          open_ai_api_key: null,
          eleven_labs_api_key: null,
          youtube_api_key: null,
          drive_client_id: null,
          drive_client_secret: null,
          drive_api_key: null,
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCredentials({
          id: data.id,
          user_id: data.user_id,
          open_ai_api_key: data.open_ai_api_key,
          eleven_labs_api_key: data.eleven_labs_api_key,
          youtube_api_key: data.youtube_api_key,
          drive_client_id: data.drive_client_id,
          drive_client_secret: data.drive_client_secret,
          drive_api_key: data.drive_api_key,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setCredentials({
          open_ai_api_key: null,
          eleven_labs_api_key: null,
          youtube_api_key: null,
          drive_client_id: null,
          drive_client_secret: null,
          drive_api_key: null,
        });
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
      setCredentials({
        open_ai_api_key: null,
        eleven_labs_api_key: null,
        youtube_api_key: null,
        drive_client_id: null,
        drive_client_secret: null,
        drive_api_key: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();

    // Listen for auth changes to reload credentials
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        loadCredentials();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    credentials,
    loading,
    error,
    refetch: loadCredentials,
    // Helper methods to access specific credentials
    getOpenAIKey: () => credentials.open_ai_api_key,
    getElevenLabsKey: () => credentials.eleven_labs_api_key,
    getYouTubeKey: () => credentials.youtube_api_key,
    getDriveClientId: () => credentials.drive_client_id,
    getDriveApiKey: () => credentials.drive_api_key,
  };
};
