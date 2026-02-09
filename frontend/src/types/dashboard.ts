/**
 * TypeScript types for Dashboard data
 */

export type DashboardSummary = {
  learningProgressPercent: number; // 0..100
  averageTestScore: number; // 0..100
  totalStudySeconds: number;
};

export type Deck = {
  id: string | number;
  name: string;
  totalCards: number;
  visibility: "public" | "private";
  lastStudiedAt?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type JoinedDeck = {
  id: string | number;
  name: string;
  totalCards: number;
  visibility: "public" | "private";
  lastStudiedAt?: string | null;
  joinedAt?: string | null;
  ownerDisplayName: string;
  created_at?: string;
  updated_at?: string;
};

export type PublicDeck = {
  id: string | number;
  name: string;
  description?: string | null;
  visibility: "public" | "private";
  totalCards: number;
  ownerDisplayName: string;
  isParticipant?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DeckDetails = {
  id: string | number;
  name: string;
  description?: string | null;
  visibility: "public" | "private";
  testShuffle?: boolean;
  testSequential?: boolean;
  totalCards: number;
  participantsCount: number;
  totalStudySeconds: number;
  isOwner: boolean;
  leaderboard: Array<{
    rank: number;
    userDisplayName: string;
    scorePercent: number;
    createdAt: string;
  }>;
  cardsPreview?: Array<{
    id: string | number;
    frontText: string;
    colorTag?: string | null;
  }>;
};

export type DeckEdit = {
  id: string | number;
  name: string;
  description?: string | null;
  visibility: "public" | "private";
  test_shuffle: boolean;
  test_sequential: boolean;
  study_spaced_repetition: boolean;
  cards: Array<{
    id?: string | number;
    front_text: string;
    back_text: string;
    color_tag?: string | null;
  }>;
};
