export type ParticipationSummary = {
  deckId: string | number;
  deckName: string;
  visibility: "public" | "private";
  isOwner: boolean;
  isParticipant: boolean;
  participantsCount: number;
  totalStudySecondsAll: number;
  totalTestAttemptsAll: number;
  ranking: Array<{
    rank: number;
    userId: string | number;
    userDisplayName: string;
    totalStudySeconds: number;
    bestScorePercent: number | null;
    avgScorePercent: number | null;
    attemptsCount: number;
    lastActiveAt: string | null;
  }>;
};
