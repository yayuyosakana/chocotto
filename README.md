# Chocotto 🍫 — ちょこっと集まる

> 今日ふらっと、目的だけで集まって、終わったら解散。名前も知らなくていい。
> 韓国で話題の **“숏셜링(ショートソーシャリング)”** の東京版。

単発・無名・後腐れゼロの“使い捨ての集まり”を作って・見つけて・参加できる PWA。
カフェで一緒に黙々作業（body doubling）/ ラン・散歩 / 軽い食事 / 街歩き。

- **本番URL**: （デプロイ後に追記）
- 要件定義: [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md)
- 設計: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- 次の一手: [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md)

---

## ⚠️ 公開後に必要な唯一の手動設定（1クリック）

認証は **匿名サインイン**（メール不要・ニックネームと絵文字だけ）で動きます。
Supabase はこれが既定で無効なので、**1回だけ有効化が必要**です：

> Supabase Dashboard → **Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable**

これを ON にすれば「はじめる」ボタンが通り、すぐ使えます。
（メール/電話OTPへ切り替える手順は [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md)）

---

## スタック

Next.js 16 (App Router) / TypeScript / Tailwind v4 / Supabase (Postgres + Auth + Realtime + pg_cron) / Vercel

## ローカル開発

```bash
npm install
npm run dev      # http://localhost:3000
```

環境変数は未設定でも動きます（`src/lib/supabase.ts` に公開キーのフォールバックあり）。
変える場合は `.env.example` を `.env.local` にコピーして編集。

## デプロイ

Vercel に接続して push すれば自動デプロイ。Supabase 側はマイグレーション適用済み
（`chocotto_core_schema` / `chocotto_realtime` / `chocotto_cleanup_cron` / `chocotto_rpcs`）。

## 安全について

公共の場所・3人以上・通報/信頼スコア・直前キャンセル制限で最低限の安全を担保。
匿名運用のため、本番では本人性のある認証への移行を推奨（[NEXT_STEPS](./docs/NEXT_STEPS.md)）。
