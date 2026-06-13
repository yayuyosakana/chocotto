# Chocotto — アーキテクチャ

## スタック

- **フロント**：Next.js 16（App Router, TypeScript）/ Tailwind CSS v4 / PWA
- **バックエンド**：Supabase（Postgres + Auth + Realtime + pg_cron）
- **ホスティング**：Vercel
- 設計方針：**ほぼクライアントサイド**。`@supabase/supabase-js` をブラウザから直接叩き、
  セキュリティ境界は **RLS**。サーバ専用シークレットは持たない（運用が軽い）。

## 画面（App Router ルート）

| ルート | 役割 |
|---|---|
| `/` | 今日の一覧（フィード）。カテゴリフィルタ＋リアルタイム |
| `/new` | 集まり作成 |
| `/g/[id]` | 集まり詳細：参加/キャンセル・チェックイン・消えるチャット・また会いたい・通報 |
| `/matches` | マッチ一覧 |
| `/matches/[id]` | マッチ相手とのDM |
| `/me` | プロフィール・信頼スコア・ログアウト |

認証ゲートは `components/RequireAuth.tsx`：未ログイン→`Landing`、未オンボ→`Onboarding`、それ以外→本体。

## データモデル（Postgres）

- `profiles`（id=auth.users, nickname, emoji, trust_score, banned_until）
- `gatherings`（host_id, category, title, venue_name, venue_url, lat/lng, start_at, duration_min, capacity, status）
- `participants`（gathering_id, user_id, status: joined/checked_in/no_show/cancelled）UNIQUE(gathering,user)
- `messages`（gathering_id, user_id, body）… 集合チャット
- `reconnects`（gathering_id, from_user, to_user）… 「また会いたい」
- `matches`（user_a, user_b, gathering_id）… 相互✓で trigger 生成
- `dm_messages`（match_id, user_id, body）… マッチ後のDM
- `reports`（reporter_id, target_id, gathering_id, reason）

### トリガー / 関数

- `enforce_capacity`（BEFORE INSERT participants）：定員・募集状態をチェック（競合防止）
- `add_host_as_participant`（AFTER INSERT gatherings）：作成者を自動で参加に
- `try_create_match`（AFTER INSERT reconnects）：相互✓なら `matches` 生成
- `record_checkin(p_gathering)` / `record_late_cancel(p_gathering)`：チェックイン・直前キャンセル処理（信頼スコア増減）
- `is_member` / `is_match_member`：RLS用ヘルパー（SECURITY DEFINER）

### RLS 要点

- `profiles`/`gatherings`/`participants`：authenticated は読み取り可、書き込みは本人/ホストのみ
- `messages`：その集まりの **参加者だけ** が読み書き可（`is_member`）
- `reconnects`：自分発のみ insert、当事者のみ select
- `matches`/`dm_messages`：当事者のみ
- `reports`：本人の insert/select のみ

### Realtime

`messages` / `participants` / `dm_messages` / `gatherings` を publication に追加。
UIは変更イベントで該当データを再フェッチ（RLSを尊重）。

### 自動消去（“消える”）

`pg_cron` ジョブ `chocotto_cleanup`（15分毎）が **終了2時間後の集まりを削除**。
participants / messages は CASCADE で消える。matches は `gathering_id` を SET NULL で残すため、
**マッチとDMは消えない**。

## 環境変数

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable キー（公開前提・RLSで保護） |

未設定でも `src/lib/supabase.ts` のフォールバック既定値で動作する（公開キーのためコミット安全）。

## マイグレーション

Supabase に適用済み：`chocotto_core_schema` → `chocotto_realtime` → `chocotto_cleanup_cron` → `chocotto_rpcs`。
