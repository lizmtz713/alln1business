import { hasSupabaseEnv } from './env';
import { hasOpenAIKey } from './openai';

export function requireSupabaseEnv(): boolean {
  return hasSupabaseEnv;
}

export function requireOpenAIKey(): boolean {
  return hasOpenAIKey;
}
