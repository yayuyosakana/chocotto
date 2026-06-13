'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { CATEGORIES, type CategoryKey, WINDOW_HOURS } from '@/lib/constants';
import {
  defaultStartLocal,
  maxStartLocal,
  localInputToISO,
} from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers';

function NewGathering() {
  const router = useRouter();
  const { session } = useAuth();
  const [category, setCategory] = useState<CategoryKey>('cafe_work');
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueUrl, setVenueUrl] = useState('');
  const [startLocal, setStartLocal] = useState(defaultStartLocal());
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(4);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!session) {
      setErr('セッションが切れたみたい');
      return;
    }
    if (!title.trim()) {
      setErr('ひとことタイトルを入れてね');
      return;
    }
    if (!venueName.trim()) {
      setErr('場所の名前を入れてね');
      return;
    }
    const startISO = localInputToISO(startLocal);
    const t = new Date(startISO).getTime();
    if (Number.isNaN(t)) {
      setErr('日時が正しくないみたい');
      return;
    }
    if (t < Date.now() - 5 * 60e3) {
      setErr('過去の時間は選べないよ');
      return;
    }
    if (t > Date.now() + WINDOW_HOURS * 3600e3 + 60e3) {
      setErr(`いまは${WINDOW_HOURS}時間先までだよ`);
      return;
    }
    if (capacity < 3) {
      setErr('安全のため定員は3人以上だよ');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('gatherings')
      .insert({
        host_id: session.user.id,
        category,
        title: title.trim(),
        venue_name: venueName.trim(),
        venue_url: venueUrl.trim() || null,
        start_at: startISO,
        duration_min: duration,
        capacity,
      })
      .select('id')
      .single();
    if (error || !data) {
      setErr(error?.message ?? '作成できませんでした');
      setSaving(false);
      return;
    }
    router.push(`/g/${data.id}`);
  };

  const labelCls = 'mt-6 block text-sm font-bold text-[#4e3525]';
  const inputCls =
    'mt-2 w-full rounded-2xl border-2 border-[#f7c9b6] bg-white px-4 py-3 outline-none focus:border-[#e0a45e]';

  return (
    <>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold text-[#6f4e37]">集まりを作る</h1>
        <p className="text-sm text-[#a98f7d]">公共の場所で・3人以上で・気軽に。</p>
      </header>

      <div className="px-5">
        <label className="mt-4 block text-sm font-bold text-[#4e3525]">
          なにする？
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                category === c.key
                  ? 'border-[#e0a45e] bg-[#fdeee2]'
                  : 'border-transparent bg-white'
              }`}
            >
              <div className="text-2xl">{c.emoji}</div>
              <div className="mt-1 text-sm font-bold text-[#4e3525]">
                {c.label}
              </div>
              <div className="text-xs text-[#a98f7d]">{c.hint}</div>
            </button>
          ))}
        </div>

        <label className={labelCls}>ひとこと</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="もくもく作業しませんか〜"
          className={inputCls}
        />

        <label className={labelCls}>場所の名前</label>
        <input
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          maxLength={120}
          placeholder="ブルーボトル 渋谷"
          className={inputCls}
        />

        <label className={labelCls}>
          Google Mapsリンク（任意）
          <span className="ml-1 font-normal text-[#a98f7d]">公共の場所でね</span>
        </label>
        <input
          value={venueUrl}
          onChange={(e) => setVenueUrl(e.target.value)}
          inputMode="url"
          placeholder="https://maps.app.goo.gl/..."
          className={inputCls}
        />

        <label className={labelCls}>いつ？（今〜48時間）</label>
        <input
          type="datetime-local"
          value={startLocal}
          min={defaultStartLocal().slice(0, 10) + 'T00:00'}
          max={maxStartLocal(WINDOW_HOURS)}
          onChange={(e) => setStartLocal(e.target.value)}
          className={inputCls}
        />

        <div className="mt-6 flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-[#4e3525]">
              長さ
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls}
            >
              <option value={30}>30分</option>
              <option value={60}>60分</option>
              <option value={90}>90分</option>
              <option value={120}>120分</option>
              <option value={180}>3時間</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-[#4e3525]">
              定員（3〜）
            </label>
            <input
              type="number"
              min={3}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        {err && <p className="mt-5 text-sm text-red-500">{err}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-8 w-full rounded-full bg-[#6f4e37] px-5 py-4 text-lg font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? '作成中…' : 'この集まりを公開する'}
        </button>
        <p className="mt-3 text-center text-xs text-[#a98f7d]">
          作るとあなたも自動で参加になります
        </p>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <NewGathering />
      </AppShell>
    </RequireAuth>
  );
}
