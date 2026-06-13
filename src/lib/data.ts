import { supabase } from '@/lib/supabase';
import type { Gathering, Participant } from '@/lib/types';
import { WINDOW_HOURS } from '@/lib/constants';

export type MiniProfile = { id: string; nickname: string; emoji: string };

export type FeedItem = {
  g: Gathering;
  host: MiniProfile | null;
  count: number;
};

const activeStatuses = ['joined', 'checked_in'];

export async function loadFeed(): Promise<FeedItem[]> {
  const { data: gs } = await supabase
    .from('gatherings')
    .select('*')
    .eq('status', 'open')
    .gte('start_at', new Date(Date.now() - 2 * 3600e3).toISOString())
    .lte('start_at', new Date(Date.now() + WINDOW_HOURS * 3600e3).toISOString())
    .order('start_at', { ascending: true });

  const gatherings = (gs ?? []) as Gathering[];
  if (gatherings.length === 0) return [];

  const ids = gatherings.map((g) => g.id);
  const hostIds = [...new Set(gatherings.map((g) => g.host_id))];

  const [{ data: parts }, { data: hosts }] = await Promise.all([
    supabase
      .from('participants')
      .select('gathering_id,user_id,status')
      .in('gathering_id', ids),
    supabase.from('profiles').select('id,nickname,emoji').in('id', hostIds),
  ]);

  const hostMap = new Map<string, MiniProfile>(
    (hosts ?? []).map((h) => [h.id, h as MiniProfile]),
  );
  const countMap = new Map<string, number>();
  (parts ?? []).forEach((p: Pick<Participant, 'gathering_id' | 'status'>) => {
    if (activeStatuses.includes(p.status)) {
      countMap.set(p.gathering_id, (countMap.get(p.gathering_id) ?? 0) + 1);
    }
  });

  return gatherings.map((g) => ({
    g,
    host: hostMap.get(g.host_id) ?? null,
    count: countMap.get(g.id) ?? 0,
  }));
}

export type DetailParticipant = Participant & { profile: MiniProfile | null };

export type GatheringDetail = {
  g: Gathering;
  host: MiniProfile | null;
  participants: DetailParticipant[];
};

export async function loadGathering(id: string): Promise<GatheringDetail | null> {
  const { data: g } = await supabase
    .from('gatherings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!g) return null;
  const gathering = g as Gathering;

  const { data: parts } = await supabase
    .from('participants')
    .select('*')
    .eq('gathering_id', id)
    .order('joined_at', { ascending: true });
  const participants = (parts ?? []) as Participant[];

  const profileIds = [
    ...new Set([gathering.host_id, ...participants.map((p) => p.user_id)]),
  ];
  const { data: profs } = await supabase
    .from('profiles')
    .select('id,nickname,emoji')
    .in('id', profileIds);
  const pMap = new Map<string, MiniProfile>(
    (profs ?? []).map((p) => [p.id, p as MiniProfile]),
  );

  return {
    g: gathering,
    host: pMap.get(gathering.host_id) ?? null,
    participants: participants.map((p) => ({
      ...p,
      profile: pMap.get(p.user_id) ?? null,
    })),
  };
}

export function activeCount(participants: DetailParticipant[]): number {
  return participants.filter((p) => activeStatuses.includes(p.status)).length;
}
