export type StudyQueueItem = {
  cardId: string | number;
  frontText: string;
  backText: string;
  colorTag?: string | null;
  dueAt?: string | null;
};

export type StudyQueueResponse = {
  deckId: string | number;
  deckName: string;
  total: number;
  items: StudyQueueItem[];
};

export type StudyAnswerPayload = {
  cardId: string | number;
  rating: "again" | "hard" | "easy";
  elapsedSeconds?: number;
};
