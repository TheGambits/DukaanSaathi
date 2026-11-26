import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  onRedirectToLogin: () => void;
}

export function ProtectedRoute({ children, onRedirectToLogin }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const isAuthenticated = Boolean(user && session);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      onRedirectToLogin();
    }
  }, [loading, isAuthenticated, onRedirectToLogin]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8F5] p-6 text-[#12332F]">
        <Loader2 className="h-9 w-9 animate-spin text-[#0F766E]" />
        <p className="mt-3 text-base font-bold">Session check ho raha hai...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
