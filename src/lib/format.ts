// Japanese relative/absolute time helpers (client-side, JST-friendly).

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.round((t - now) / 60000);

  if (diffMin <= -60) {
    const h = Math.round(-diffMin / 60);
    return `${h}時間前`;
  }
  if (diffMin < 0) return `${-diffMin}分前`;
  if (diffMin === 0) return 'まもなく';
  if (diffMin < 60) return `あと${diffMin}分`;

  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h < 24) return m ? `あと${h}時間${m}分` : `あと${h}時間`;
  return `${Math.round(h / 24)}日後`;
}

export function clockLabel(iso: string): string {
  const d = new Date(iso);
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tmr = new Date(today);
  tmr.setDate(today.getDate() + 1);
  const isTmr = d.toDateString() === tmr.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const day = isToday ? '今日' : isTmr ? '明日' : `${d.getMonth() + 1}/${d.getDate()}(${wd})`;
  return `${day} ${hh}:${mm}`;
}

// datetime-local value (local tz) -> ISO
export function localInputToISO(v: string): string {
  return new Date(v).toISOString();
}

// default datetime-local value rounded to next :00/:30, +1h from now
export function defaultStartLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (d.getMinutes() === 0 && new Date().getMinutes() >= 30) d.setHours(d.getHours() + 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function maxStartLocal(hours: number): string {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
