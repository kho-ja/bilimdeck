import type { AiProviderConfig, AiUserSettings } from '@/types/ai';

export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/free',
    models: [
      'openrouter/free',
      'stepfun/step-3.5-flash:free',
      'arcee-ai/trinity-mini:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'google/gemini-3.1-flash-lite-preview',
      'qwen/qwen3.5-9b',
      'openai/gpt-4o-mini',
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama3-8b-8192'],
  },
  {
    id: 'together',
    label: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'],
  },
];

const STORAGE_KEY = 'bilimdeck.ai.settings';

export const defaultAiSettings = (): AiUserSettings => ({
  providerId: AI_PROVIDERS[0].id,
  model: AI_PROVIDERS[0].defaultModel,
  apiKey: '',
});

export const loadAiSettings = (): AiUserSettings => {
  if (typeof window === 'undefined') return defaultAiSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAiSettings();
    const parsed = JSON.parse(raw) as Partial<AiUserSettings>;
    const provider = AI_PROVIDERS.find((p) => p.id === parsed.providerId) || AI_PROVIDERS[0];
    return {
      providerId: provider.id,
      model: parsed.model && provider.models.includes(parsed.model) ? parsed.model : provider.defaultModel,
      apiKey: parsed.apiKey || '',
    };
  } catch {
    return defaultAiSettings();
  }
};

export const saveAiSettings = (settings: AiUserSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
