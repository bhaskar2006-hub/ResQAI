'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/utils/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setError(error?.message || 'Failed to get session');
        return;
      }

      const response = await api.post('/auth/google', {
        access_token: session.access_token,
      }) as {
        success: boolean;
        token: string;
        data: { user: { role: string; name: string; email: string; id: string } };
      };

      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        const backendRole = response.data.user.role.toLowerCase();
        router.push(`/${backendRole}`);
      } else {
        setError('Authentication failed');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-6 rounded-lg border border-severity-critical/20 bg-severity-critical/5 text-severity-critical text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Completing sign in...</span>
      </div>
    </div>
  );
}
