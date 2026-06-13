'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { CATEGORIES, categoryOf } from '@/lib/constants';
import { loadFeed, type FeedItem } from '@/lib/data';
import { relativeTime, clockLabel } from '@/lib/format';
import { supabase } from '@/lib/supabase';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-[#6f4e37] text-white' : 'bg-white text-[#a98f7d]'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-3xl bg-white p-8 text-center">
      <div className="text-5xl">🍫</div>
      <p className="mt-3 font-bold text-[#6f4e37]">まだ集まりがないみたい</p>
      <p className="mt-1 text-sm text-[#a98f7d]">最初の1つを作ってみる？</p>
      <Link
        href="/new"
        className="mt-5 inline-block rounded-full bg-[#6f4e37] px-6 py-3 font-extrabold text-white"
      >
        ＋ 集まりを作る
      </Link>
    </div>
  );
}

function Feed() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setItems(await loadFeed());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel('feed-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gatherings' },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [reload]);

  const filtered = items?.filter((i) => !cat || i.g.category === cat) ?? null;

  return (
    <>
      <header className="px-5 pb-3 pt-8">
        <h1 className="text-2xl font-extrabold text-[#6f4e37]">
          今日のChocotto 🍫
        </h1>
        <p className="text-sm text-[#a98f7d]">
          ふらっと集まれる、これから48時間。
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-3">
        <Chip active={!cat} onClick={() => setCat(null)}>
          すべて
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {filtered === null && (
          <p className="py-10 text-center text-[#a98f7d]">読み込み中…</p>
        )}
        {filtered && filtered.length === 0 && <EmptyState />}
        {filtered?.map(({ g, host, count }) => {
          const c = categoryOf(g.category);
          const full = count >= g.capacity;
          return (
            <Link
              key={g.id}
              href={`/g/${g.id}`}
              className="block rounded-3xl bg-white p-4 shadow-[0_4px_18px_rgba(111,78,55,0.08)] transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-[#fdeee2] px-3 py-1 text-xs font-bold text-[#6f4e37]">
                  {c.emoji} {c.label}
                </span>
                <span className="text-xs font-bold text-[#e0a45e]">
                  {relativeTime(g.start_at)}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-extrabold text-[#4e3525]">
                {g.title}
              </h2>
              <p className="mt-1 text-sm text-[#a98f7d]">📍 {g.venue_name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#a98f7d]">
                  {clockLabel(g.start_at)}・{g.duration_min}分
                </span>
                <span
                  className={`text-xs font-bold ${
                    full ? 'text-[#c98a8a]' : 'text-[#6f4e37]'
                  }`}
                >
                  {host ? `${host.emoji} ${host.nickname}・` : ''}
                  {count}/{g.capacity}
                  {full ? ' 満席' : ''}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <AppShell>
        <Feed />
      </AppShell>
    </RequireAuth>
  );
}
