import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useErrorLogger = () => {
  const { toast } = useToast();

  const logError = async (
    generationType: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('generation_logs')
        .insert({
          user_id: session.session?.user.id || null,
          generation_type: generationType,
          status: 'error',
          error_message: errorMessage,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Failed to log error:', error);
      }

      // Show toast notification to user
      toast({
        title: "Error Occurred",
        description: `${generationType}: ${errorMessage}`,
        variant: "destructive",
      });
    } catch (err) {
      console.error('Error logging failed:', err);
    }
  };

  const logSuccess = async (
    generationType: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('generation_logs')
        .insert({
          user_id: session.session?.user.id || null,
          generation_type: generationType,
          status: 'success',
          metadata: metadata || {}
        });

      if (error) {
        console.error('Failed to log success:', error);
      }

      toast({
        title: "Success",
        description: `${generationType} completed successfully`,
      });
    } catch (err) {
      console.error('Success logging failed:', err);
    }
  };

  const logStart = async (
    generationType: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('generation_logs')
        .insert({
          user_id: session.session?.user.id || null,
          generation_type: generationType,
          status: 'started',
          metadata: metadata || {}
        });

      if (error) {
        console.error('Failed to log start:', error);
      }
    } catch (err) {
      console.error('Start logging failed:', err);
    }
  };

  return { logError, logSuccess, logStart };
};