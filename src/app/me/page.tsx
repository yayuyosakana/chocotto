'use client';

import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/app/providers';

function Me() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  const banned =
    profile.banned_until && new Date(profile.banned_until).getTime() > Date.now();

  return (
    <>
      <header className="px-5 pb-3 pt-8">
        <h1 className="text-2xl font-extrabold text-[#6f4e37]">じぶん</h1>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(111,78,55,0.08)]">
          <span className="text-5xl">{profile.emoji}</span>
          <div>
            <div className="text-lg font-extrabold text-[#4e3525]">
              {profile.nickname}
            </div>
            <div className="mt-1 text-sm text-[#a98f7d]">
              信頼スコア{' '}
              <span className="font-bold text-[#6f4e37]">
                {profile.trust_score}
              </span>
            </div>
          </div>
        </div>

        {banned && (
          <div className="mt-4 rounded-2xl bg-[#fdeee2] p-4 text-sm text-[#b06a4a]">
            直前キャンセルのため、しばらく新しい参加が制限されています🙏
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white p-5 text-sm leading-relaxed text-[#a98f7d]">
          <p className="font-bold text-[#6f4e37]">Chocotto 🍫 とは</p>
          <p className="mt-2">
            今日ふらっと、目的だけで集まって、終わったら解散。名前も知らなくていい、
            気楽なつながり。韓国で話題の“숏셜링”の東京版です。
          </p>
          <p className="mt-2">
            会場は公共の場所で・3人以上で・安全第一で。気になることがあれば各集まりから通報できます。
          </p>
        </div>

        <button
          onClick={signOut}
          className="mt-6 w-full rounded-full border-2 border-[#f1e4d8] px-5 py-3.5 font-bold text-[#a98f7d]"
        >
          ログアウト
        </button>
        <p className="mt-3 text-center text-[11px] text-[#cdb7a8]">
          匿名アカウントです。ログアウトすると元に戻せない場合があります。
        </p>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <Me />
      </AppShell>
    </RequireAuth>
  );
}
