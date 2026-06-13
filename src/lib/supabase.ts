'use client';

import { createClient } from '@supabase/supabase-js';

// Publishable/anon key is public by design — RLS is the security boundary.
// Defaults let the production build work even if Vercel env vars are not set.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://grbsiivznbxbkwhkfkgt.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnNpaXZ6bmJ4Ymt3aGtma2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjk5NzgsImV4cCI6MjA5Njk0NTk3OH0.8yH_3A_8QVYZB3g7U0K9R3pn9kHSqGROPJzH-7PtqQU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
