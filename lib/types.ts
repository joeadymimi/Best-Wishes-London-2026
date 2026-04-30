export type MatchStatus = "live" | "upcoming" | "finished";
export type MatchPhase = "group" | "knockout";
export type RitualType = "incense" | "mokugyo" | "beads";

export type Blessings = {
  incense: number;
  mokugyo: number;
  beads: number;
};

export type Message = {
  id: string;
  ritual: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
};

export type UserSession = {
  blessings: number;
  lastMessage: string;
  snapshotScore: string;
  repaid: boolean;
};

export type MatchItem = {
  id: string;
  phase: MatchPhase;
  group?: string;
  bracketRound?: string;
  bracketColumn?: string;
  stage: string;
  status: MatchStatus;
  table: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  detail: string;
  time: string;
  note: string;
  blessings: Blessings;
  togetherNow: number;
  fortune: number;
  sourceName?: string;
  sourceUrl?: string;
  updatedAt?: string;
  messages: Message[];
  userSession: UserSession;
};

export type GroupStanding = {
  name: string;
  subtitle: string;
  qualified: string[];
};

export type KnockoutRound = {
  title: string;
  items: string[];
};
