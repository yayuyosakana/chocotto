'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { DmMessage, Match } from '@/lib/types';
import type { MiniProfile } from '@/lib/data';

function Dm({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const me = session?.user.id;
  const [other, setOther] = useState<MiniProfile | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [body, setBody] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as DmMessage[]);
  }, [matchId]);

  useEffect(() => {
    (async () => {
      if (!me) return;
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle();
      if (!m) {
        setValid(false);
        return;
      }
      const match = m as Match;
      const otherId = match.user_a === me ? match.user_b : match.user_a;
      const { data: p } = await supabase
        .from('profiles')
        .select('id,nickname,emoji')
        .eq('id', otherId)
        .maybeSingle();
      setOther((p as MiniProfile) ?? null);
      setValid(true);
      await loadMessages();
    })();
  }, [matchId, me, loadMessages]);

  useEffect(() => {
    const ch = supabase
      .channel(`dm-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dm_messages', filter: `match_id=eq.${matchId}` },
        () => void loadMessages(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [matchId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const text = body.trim();
    if (!text || !me) return;
    setBody('');
    const { error } = await supabase
      .from('dm_messages')
      .insert({ match_id: matchId, user_id: me, body: text });
    if (error) setBody(text);
    else await loadMessages();
  };

  if (valid === false) {
    return (
      <div className="px-5 py-20 text-center text-[#a98f7d]">
        この会話は見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#f1e4d8] bg-[#fff8f0]/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.push('/matches')}
          className="text-sm font-bold text-[#a98f7d]"
        >
          ←
        </button>
        <span className="text-2xl">{other?.emoji ?? '🙂'}</span>
        <span className="font-bold text-[#4e3525]">
          {other?.nickname ?? '名無し'}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[#cdb7a8]">
            マッチしました🤝 さっそく話しかけてみよう
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === me;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-[#6f4e37] text-white' : 'bg-white text-[#4e3525]'
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-[#f1e4d8] bg-[#fff8f0]/95 p-3 backdrop-blur">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          maxLength={500}
          placeholder="メッセージ…"
          className="flex-1 rounded-full border-2 border-[#f1e4d8] bg-white px-4 py-2 text-sm outline-none focus:border-[#e0a45e]"
        />
        <button
          onClick={send}
          className="rounded-full bg-[#6f4e37] px-5 py-2 text-sm font-bold text-white"
        >
          送信
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth>
      <Dm matchId={params.id} />
    </RequireAuth>
  );
}
