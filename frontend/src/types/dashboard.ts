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
