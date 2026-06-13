export type Profile = {
  id: string;
  nickname: string;
  emoji: string;
  trust_score: number;
  banned_until: string | null;
  created_at: string;
};

export type Gathering = {
  id: string;
  host_id: string;
  category: string;
  title: string;
  venue_name: string;
  venue_url: string | null;
  lat: number | null;
  lng: number | null;
  start_at: string;
  duration_min: number;
  capacity: number;
  status: 'open' | 'full' | 'closed' | 'cancelled';
  created_at: string;
};

export type ParticipantStatus = 'joined' | 'checked_in' | 'no_show' | 'cancelled';

export type Participant = {
  id: string;
  gathering_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
};

export type Message = {
  id: string;
  gathering_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  gathering_id: string | null;
  created_at: string;
};

export type DmMessage = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
