'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Match } from '@/lib/types';
import type { MiniProfile } from '@/lib/data';

function MatchesList() {
  const { session } = useAuth();
  const me = session?.user.id;
  const [rows, setRows] = useState<
    { match: Match; other: MiniProfile | null }[] | null
  >(null);

  const load = useCallback(async () => {
    if (!me) return;
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    const ms = (matches ?? []) as Match[];
    const otherIds = ms.map((m) => (m.user_a === me ? m.user_b : m.user_a));
    const { data: profs } = await supabase
      .from('profiles')
      .select('id,nickname,emoji')
      .in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const pMap = new Map<string, MiniProfile>(
      (profs ?? []).map((p) => [p.id, p as MiniProfile]),
    );
    setRows(
      ms.map((m) => ({
        match: m,
        other: pMap.get(m.user_a === me ? m.user_b : m.user_a) ?? null,
      })),
    );
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <header className="px-5 pb-3 pt-8">
        <h1 className="text-2xl font-extrabold text-[#6f4e37]">また会いたい 🤝</h1>
        <p className="text-sm text-[#a98f7d]">
          お互い「また」を押した人と、ここで続けて話せます。
        </p>
      </header>

      <div className="flex flex-col gap-2 px-5">
        {rows === null && (
          <p className="py-10 text-center text-[#a98f7d]">読み込み中…</p>
        )}
        {rows && rows.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center">
            <div className="text-5xl">🌱</div>
            <p className="mt-3 font-bold text-[#6f4e37]">まだマッチはありません</p>
            <p className="mt-1 text-sm text-[#a98f7d]">
              集まりで会った人に「また会いたい」を送ってみよう
            </p>
          </div>
        )}
        {rows?.map(({ match, other }) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 transition active:scale-[0.99]"
          >
            <span className="text-3xl">{other?.emoji ?? '🙂'}</span>
            <div className="flex-1">
              <div className="font-bold text-[#4e3525]">
                {other?.nickname ?? '名無し'}
              </div>
              <div className="text-xs text-[#a98f7d]">タップして話す →</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <MatchesList />
      </AppShell>
    </RequireAuth>
  );
}
