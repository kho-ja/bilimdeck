export type TestMode = "shuffle" | "sequential";

export type TestQuestion = {
  cardId: string | number;
  frontText: string;
  backText: string;
};

export type StartTestResponse = {
  attemptId: string | number;
  mode: TestMode;
  total: number;
  questions: TestQuestion[];
};

export type SubmitAnswerPayload = {
  attemptId: string | number;
  cardId: string | number;
  answerText: string;
  elapsedSeconds?: number;
};

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  correctAnswer: string;
};

export type FinishTestResponse = {
  attemptId: string | number;
  scorePercent: number;
  correctCount: number;
  total: number;
  totalSeconds: number;
  review: Array<{
    cardId: string | number;
    frontText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  leaderboard: Array<{
    rank: number;
    userDisplayName: string;
    scorePercent: number;
    createdAt: string;
  }>;
};
