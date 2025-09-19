import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Login } from "@/pages/Login";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { profile, loading: profileLoading, ensureUserProfile } = useUserProfile();

  useEffect(() => {
    // Quando o usuário está autenticado mas não tem perfil, tenta criar
    if (isAuthenticated && !profileLoading && !profile) {
      ensureUserProfile();
    }
  }, [isAuthenticated, profile, profileLoading, ensureUserProfile]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};
