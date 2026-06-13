'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Landing() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      const msg = error.message.toLowerCase();
      setErr(
        msg.includes('disabled') || msg.includes('anonymous')
          ? 'ログインの準備中みたい🙏 少し待ってもう一度試してね。'
          : 'はじめられませんでした：' + error.message,
      );
      setLoading(false);
    }
    // 成功時は onAuthStateChange が走って自動でオンボーディングへ
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="animate-pop text-7xl">🍫</div>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#6f4e37]">
        Chocotto
      </h1>
      <p className="mt-1 text-base font-bold text-[#4e3525]">ちょこっと集まる</p>
      <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#a98f7d]">
        今日ふらっと、目的だけで集まって、
        <br />
        終わったら解散。名前も知らなくていい。
      </p>
      <div className="mt-4 rounded-full bg-[#fdeee2] px-3 py-1 text-xs font-bold text-[#6f4e37]">
        🇰🇷 韓国で話題の“숏셜링”、東京版
      </div>

      <button
        onClick={start}
        disabled={loading}
        className="mt-10 w-full max-w-xs rounded-full bg-[#6f4e37] px-5 py-4 text-lg font-extrabold text-white transition active:scale-[0.97] disabled:opacity-50"
      >
        {loading ? 'はじめてるよ…' : 'はじめる（メール不要）'}
      </button>
      <p className="mt-3 text-xs text-[#a98f7d]">ニックネームと絵文字だけ・30秒</p>
      {err && <p className="mt-5 max-w-xs text-sm text-red-500">{err}</p>}
    </main>
  );
}
