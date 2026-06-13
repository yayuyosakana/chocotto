export type CategoryKey = 'cafe_work' | 'run_walk' | 'light_meal' | 'stroll';

export const CATEGORIES: {
  key: CategoryKey;
  emoji: string;
  label: string;
  hint: string;
}[] = [
  { key: 'cafe_work', emoji: '☕', label: 'もくもく作業', hint: 'カフェ/コワークで各自' },
  { key: 'run_walk', emoji: '🏃', label: 'ラン・散歩', hint: '軽く体を動かす' },
  { key: 'light_meal', emoji: '🍽️', label: '軽い食事・カフェ', hint: 'ゆるく一緒に' },
  { key: 'stroll', emoji: '🎨', label: '展示・街歩き', hint: '一緒に見て回る' },
];

export const categoryOf = (key: string) =>
  CATEGORIES.find((c) => c.key === key) ?? { key, emoji: '✨', label: key, hint: '' };

export const AVATAR_EMOJIS = [
  '🍫', '🐻', '🐱', '🦊', '🐼', '🐧', '🦉', '🐰',
  '🐢', '🦭', '🌽', '🍓', '🍵', '🌿', '⭐', '🌙',
  '🔥', '🎈', '🧸', '👾', '🍡', '🐥', '🦔', '🪼',
];

// "今日ふらっと" = open window for creating/seeing gatherings (hours from now)
export const WINDOW_HOURS = 48;
// Cancelling within this many hours of start = late cancel (penalty)
export const LATE_CANCEL_HOURS = 2;
