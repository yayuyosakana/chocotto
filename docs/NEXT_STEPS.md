# Chocotto — 次の一手（MVP後の強化）

優先度つきの宿題。MVPで意図的に後回しにしたもの＋運用で必要になるもの。

## 🔴 立ち上げ前に効く

1. **本人性のある認証へ（匿名 → OTP）**
   - 今は匿名サインイン（気楽さ優先）。荒らし/ノーショー対策の実効性のため、本番は
     **メールOTP** か **電話OTP** へ。
   - メールOTP：Supabase Dashboard → Authentication → Email Templates の Magic Link に
     `{{ .Token }}` を追加（6桁コード表示）。`signInWithOtp` → `verifyOtp(type:'email')`。
   - 電話OTP：Twilio等のSMSプロバイダ契約 → Supabase の Phone Provider に設定。
2. **女性安全モードの再検討**
   - 現状は性別データを持たない＝女性限定フィルタ不可。普及データ次第で「女性のみ集まり」を検討。
3. **会場の“公共のみ”担保強化**
   - 登録スポットDB（カフェ/コワーク/公園）を用意し、自由入力リンクは通報＋審査でカバー。

## 🟡 体験を伸ばす

4. **Web Push 通知**（「1時間後に開始」「定員到達」「マッチ」）
   - VAPID鍵生成 → service worker に push ハンドラ → 配信は Supabase Edge Function。
   - iOSはホーム画面追加済みPWA（iOS 16.4+）でのみ可。
5. **PNGアイコン**：現在は `icon.svg` のみ。`icon-192.png` / `icon-512.png` / `apple-touch-icon.png` を追加すると
   iOSのホーム画面追加が綺麗になる。
6. **位置/距離フィルタ**：現在は時間＋カテゴリのみ。現在地から近い順・距離表示（PostGIS or Haversine）。
7. **ブロック機能**：通報に加えて相互ブロック（一覧/チャットから除外）。
8. **no-show 自動判定**：終了後にチェックイン無しを `no_show` にする cron＋信頼スコア反映。

## 🟢 ビジネス

9. **マネタイズ検証**：第一候補は **店舗提携(B2B)**（平日昼のカフェ空席を「もくもく会」で埋める）。
10. **GTM/点火**：1エリア×1カテゴリ（例：渋谷の平日昼カフェ作業）に集中して流動性を作る。
    運営シード開催（自分がホスト）＋既存もくもく会との提携。

## メモ

- 認証方式を変えても `profiles` テーブルはそのまま使える（id=auth.users）。
- `src/lib/supabase.ts` の anon キーは公開前提。サーバ専用処理を足す場合のみ service_role を
  サーバ側（Edge Function / Route Handler）に隔離すること。
