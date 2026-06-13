'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers';
import { AVATAR_EMOJIS } from '@/lib/constants';

export function Onboarding() {
  const { session, refresh, signOut } = useAuth();
  const [nickname, setNickname] = useState('');
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const n = nickname.trim();
    if (!n) {
      setErr('ニックネームを入れてね');
      return;
    }
    if (!session) {
      setErr('セッションが切れたみたい。もう一度はじめてね');
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await supabase
      .from('profiles')
      .insert({ id: session.user.id, nickname: n, emoji });
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    await refresh();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#6f4e37]">はじめまして🍫</h1>
      <p className="mt-1 text-sm text-[#a98f7d]">
        本名はいらない。呼び名と絵文字だけ決めよう。
      </p>

      <label className="mt-8 block text-sm font-bold text-[#4e3525]">
        ニックネーム
      </label>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        placeholder="ちょこ太"
        className="mt-2 w-full rounded-2xl border-2 border-[#f7c9b6] bg-white px-4 py-3 text-lg outline-none focus:border-[#e0a45e]"
      />

      <label className="mt-6 block text-sm font-bold text-[#4e3525]">アイコン</label>
      <div className="mt-2 grid grid-cols-8 gap-2">
        {AVATAR_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`aspect-square rounded-xl text-2xl transition ${
              emoji === e ? 'scale-110 bg-[#e0a45e]' : 'bg-white'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-4">
        <div className="text-4xl">{emoji}</div>
        <div className="font-bold text-[#6f4e37]">
          {nickname.trim() || 'プレビュー'}
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-red-500">{err}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-auto rounded-full bg-[#6f4e37] px-5 py-4 text-lg font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? '作成中…' : 'はじめる'}
      </button>
      <button
        onClick={signOut}
        className="mt-3 text-center text-xs text-[#a98f7d]"
      >
        やりなおす
      </button>
    </main>
  );
}
