'use client';

import { useAuth } from '@/app/providers';
import { Landing } from './Landing';
import { Onboarding } from './Onboarding';
import { Spinner } from './Spinner';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner label="読み込み中…" />;
  if (!session) return <Landing />;
  if (!profile) return <Onboarding />;
  return <>{children}</>;
}
