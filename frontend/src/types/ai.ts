export type AiProviderConfig = {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
};

export type AiUserSettings = {
  providerId: string;
  model: string;
  apiKey: string;
};

export type AiToolResultSearch = {
  query: string;
  count: number;
  results: Array<{
    id: number;
    name: string;
    description?: string | null;
    ownerDisplayName: string;
    totalCards: number;
    route: string;
  }>;
};

export type AiToolResultCreate = {
  id: number;
  name: string;
  visibility: 'public' | 'private';
  totalCards: number;
  route: string;
};

export type AiToolResultOpen = {
  deckId: number;
  route: string;
  canAccess: boolean;
};
