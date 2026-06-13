'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import {
  loadGathering,
  activeCount,
  type GatheringDetail,
} from '@/lib/data';
import type { Message } from '@/lib/types';
import { categoryOf, LATE_CANCEL_HOURS } from '@/lib/constants';
import { clockLabel, relativeTime } from '@/lib/format';

function mapsHref(venueName: string, venueUrl: string | null): string {
  if (venueUrl && /^https?:\/\//.test(venueUrl)) return venueUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venueName,
  )}`;
}

function Detail({ id }: { id: string }) {
  const router = useRouter();
  const { session, refresh } = useAuth();
  const me = session?.user.id;

  const [detail, setDetail] = useState<GatheringDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reconnectIds, setReconnectIds] = useState<Set<string>>(new Set());
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myPart = detail?.participants.find((p) => p.user_id === me) ?? null;
  const isMember =
    myPart != null && (myPart.status === 'joined' || myPart.status === 'checked_in');

  const reloadDetail = useCallback(async () => {
    const d = await loadGathering(id);
    if (!d) {
      setNotFound(true);
      return;
    }
    setDetail(d);
  }, [id]);

  const reloadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('gathering_id', id)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
  }, [id]);

  const reloadSocial = useCallback(async () => {
    if (!me) return;
    const [{ data: recs }, { data: matches }] = await Promise.all([
      supabase
        .from('reconnects')
        .select('to_user')
        .eq('gathering_id', id)
        .eq('from_user', me),
      supabase.from('matches').select('user_a,user_b'),
    ]);
    setReconnectIds(new Set((recs ?? []).map((r) => r.to_user as string)));
    const set = new Set<string>();
    (matches ?? []).forEach((m) => {
      if (m.user_a === me) set.add(m.user_b as string);
      else if (m.user_b === me) set.add(m.user_a as string);
    });
    setMatchedIds(set);
  }, [id, me]);

  useEffect(() => {
    void reloadDetail();
    void reloadSocial();
  }, [reloadDetail, reloadSocial]);

  useEffect(() => {
    if (isMember) void reloadMessages();
  }, [isMember, reloadMessages]);

  useEffect(() => {
    const ch = supabase
      .channel(`g-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `gathering_id=eq.${id}` },
        () => void reloadMessages(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `gathering_id=eq.${id}` },
        () => void reloadDetail(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [id, reloadMessages, reloadDetail]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (notFound) {
    return (
      <div className="px-5 py-20 text-center">
        <div className="text-5xl">🍂</div>
        <p className="mt-3 font-bold text-[#6f4e37]">
          この集まりは見つかりませんでした
        </p>
        <p className="mt-1 text-sm text-[#a98f7d]">
          終了して解散したのかも（Chocottoは終わると消えます）
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-full bg-[#6f4e37] px-6 py-3 font-extrabold text-white"
        >
          今日の一覧へ
        </button>
      </div>
    );
  }

  if (!detail) {
    return <p className="px-5 py-20 text-center text-[#a98f7d]">読み込み中…</p>;
  }

  const { g, host, participants } = detail;
  const c = categoryOf(g.category);
  const count = activeCount(participants);
  const full = count >= g.capacity;
  const startMs = new Date(g.start_at).getTime();
  const endMs = startMs + g.duration_min * 60e3;
  const now = Date.now();
  const ended = now > endMs;
  const canCheckIn =
    isMember &&
    myPart?.status === 'joined' &&
    now >= startMs - 30 * 60e3 &&
    now <= endMs + 30 * 60e3;

  const join = async () => {
    if (!me || busy) return;
    setBusy(true);
    let error;
    if (myPart) {
      ({ error } = await supabase
        .from('participants')
        .update({ status: 'joined' })
        .eq('gathering_id', g.id)
        .eq('user_id', me));
    } else {
      ({ error } = await supabase
        .from('participants')
        .insert({ gathering_id: g.id, user_id: me }));
    }
    setBusy(false);
    if (error) {
      alert(
        error.message.includes('full')
          ? '満席になっちゃった🙏'
          : error.message.includes('banned') || error.message.includes('not_open')
            ? '今は参加できないみたい'
            : error.message,
      );
    }
    await reloadDetail();
    await reloadMessages();
  };

  const cancel = async () => {
    if (!me || busy) return;
    if (!confirm('この集まりをキャンセルする？')) return;
    setBusy(true);
    const late = now > startMs - LATE_CANCEL_HOURS * 3600e3;
    if (late) {
      await supabase.rpc('record_late_cancel', { p_gathering: g.id });
      alert(
        `直前キャンセルのため、しばらく新しい参加ができません🙏\n（信頼スコアも少し下がります）`,
      );
    } else {
      await supabase
        .from('participants')
        .update({ status: 'cancelled' })
        .eq('gathering_id', g.id)
        .eq('user_id', me);
    }
    setBusy(false);
    await reloadDetail();
    await refresh();
  };

  const checkIn = async () => {
    if (busy) return;
    setBusy(true);
    await supabase.rpc('record_checkin', { p_gathering: g.id });
    setBusy(false);
    await reloadDetail();
    await refresh();
  };

  const send = async () => {
    const text = body.trim();
    if (!text || !me) return;
    setBody('');
    const { error } = await supabase
      .from('messages')
      .insert({ gathering_id: g.id, user_id: me, body: text });
    if (error) setBody(text);
    else await reloadMessages();
  };

  const toggleReconnect = async (targetId: string) => {
    if (!me || reconnectIds.has(targetId)) return;
    await supabase
      .from('reconnects')
      .insert({ gathering_id: g.id, from_user: me, to_user: targetId });
    await reloadSocial();
  };

  const report = async (targetId: string) => {
    if (!me) return;
    const reason = window.prompt('通報の理由（任意）。気になる点があれば教えてね。');
    if (reason === null) return;
    await supabase.from('reports').insert({
      reporter_id: me,
      target_id: targetId,
      gathering_id: g.id,
      reason: reason || null,
    });
    alert('通報を受け付けました。ありがとう🙏');
  };

  const others = participants.filter(
    (p) =>
      p.user_id !== me &&
      (p.status === 'joined' || p.status === 'checked_in'),
  );

  const nameOf = (uid: string) =>
    participants.find((p) => p.user_id === uid)?.profile;

  return (
    <>
      <header className="px-5 pb-2 pt-6">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold text-[#a98f7d]"
        >
          ← 今日の一覧
        </button>
      </header>

      <div className="px-5">
        <div className="rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(111,78,55,0.08)]">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#fdeee2] px-3 py-1 text-xs font-bold text-[#6f4e37]">
              {c.emoji} {c.label}
            </span>
            <span className="text-xs font-bold text-[#e0a45e]">
              {ended ? '終了' : relativeTime(g.start_at)}
            </span>
          </div>
          <h1 className="mt-3 text-xl font-extrabold text-[#4e3525]">
            {g.title}
          </h1>
          <a
            href={mapsHref(g.venue_name, g.venue_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-bold text-[#6f4e37] underline"
          >
            📍 {g.venue_name}
          </a>
          <p className="mt-2 text-sm text-[#a98f7d]">
            🕒 {clockLabel(g.start_at)}・{g.duration_min}分
          </p>
          <p className="mt-1 text-sm font-bold text-[#6f4e37]">
            {host ? `${host.emoji} ${host.nickname} さんの主催・` : ''}
            {count}/{g.capacity} 人{full ? '（満席）' : ''}
          </p>

          {/* 参加アクション */}
          <div className="mt-4">
            {!isMember && !full && (
              <button
                onClick={join}
                disabled={busy}
                className="w-full rounded-full bg-[#6f4e37] px-5 py-3.5 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                ワンタップで参加する
              </button>
            )}
            {!isMember && full && (
              <div className="w-full rounded-full bg-[#f1e4d8] px-5 py-3.5 text-center font-bold text-[#a98f7d]">
                満席です
              </div>
            )}
            {isMember && (
              <div className="flex gap-2">
                {canCheckIn && (
                  <button
                    onClick={checkIn}
                    disabled={busy}
                    className="flex-1 rounded-full bg-[#e0a45e] px-4 py-3.5 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
                  >
                    📍 到着チェックイン
                  </button>
                )}
                {myPart?.status === 'checked_in' && (
                  <div className="flex-1 rounded-full bg-[#cfe8d8] px-4 py-3.5 text-center font-bold text-[#3f7d5c]">
                    ✓ チェックイン済み
                  </div>
                )}
                <button
                  onClick={cancel}
                  disabled={busy}
                  className="rounded-full border-2 border-[#f1e4d8] px-4 py-3.5 text-sm font-bold text-[#a98f7d]"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 参加者 + また会いたい */}
        <h2 className="mt-6 px-1 text-sm font-bold text-[#4e3525]">参加者</h2>
        <div className="mt-2 flex flex-col gap-2">
          {participants
            .filter((p) => p.status === 'joined' || p.status === 'checked_in')
            .map((p) => {
              const isMe = p.user_id === me;
              const matched = matchedIds.has(p.user_id);
              const pressed = reconnectIds.has(p.user_id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3"
                >
                  <span className="text-2xl">{p.profile?.emoji ?? '🙂'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#4e3525]">
                      {p.profile?.nickname ?? '名無し'}
                      {isMe && ' (あなた)'}
                      {p.user_id === g.host_id && ' 👑'}
                    </div>
                    {p.status === 'checked_in' && (
                      <div className="text-xs text-[#3f7d5c]">✓ 来てる</div>
                    )}
                  </div>
                  {isMember && !isMe && (
                    <>
                      {matched ? (
                        <span className="rounded-full bg-[#cfe8d8] px-3 py-1 text-xs font-bold text-[#3f7d5c]">
                          🤝 マッチ
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleReconnect(p.user_id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            pressed
                              ? 'bg-[#fdeee2] text-[#e0a45e]'
                              : 'bg-[#6f4e37] text-white active:scale-95'
                          }`}
                        >
                          {pressed ? '送信済み' : 'また会いたい'}
                        </button>
                      )}
                      <button
                        onClick={() => report(p.user_id)}
                        className="text-[10px] text-[#cdb7a8]"
                        aria-label="通報"
                      >
                        通報
                      </button>
                    </>
                  )}
                </div>
              );
            })}
        </div>
        {isMember && others.length > 0 && (
          <p className="mt-2 px-1 text-xs text-[#a98f7d]">
            両者が「また会いたい」を押すとマッチして、アプリ内で続けて話せます（連絡先は交換しません）。
          </p>
        )}

        {/* チャット */}
        <h2 className="mt-6 px-1 text-sm font-bold text-[#4e3525]">
          集合チャット
          <span className="ml-1 font-normal text-[#a98f7d]">
            （終了後に消えます）
          </span>
        </h2>
        {!isMember ? (
          <div className="mt-2 rounded-2xl bg-white p-5 text-center text-sm text-[#a98f7d]">
            参加するとチャットできます💬
          </div>
        ) : (
          <div className="mt-2 rounded-2xl bg-white p-3">
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {messages.length === 0 && (
                <p className="py-6 text-center text-sm text-[#cdb7a8]">
                  まだメッセージはありません
                </p>
              )}
              {messages.map((m) => {
                const mine = m.user_id === me;
                const prof = nameOf(m.user_id);
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[75%]">
                      {!mine && (
                        <div className="mb-0.5 ml-1 text-[10px] text-[#a98f7d]">
                          {prof?.emoji} {prof?.nickname ?? '名無し'}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-[#6f4e37] text-white'
                            : 'bg-[#f3ece5] text-[#4e3525]'
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void send();
                }}
                maxLength={500}
                placeholder="メッセージ…"
                className="flex-1 rounded-full border-2 border-[#f1e4d8] px-4 py-2 text-sm outline-none focus:border-[#e0a45e]"
              />
              <button
                onClick={send}
                className="rounded-full bg-[#6f4e37] px-4 py-2 text-sm font-bold text-white"
              >
                送信
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth>
      <AppShell>
        <Detail id={params.id} />
      </AppShell>
    </RequireAuth>
  );
}
