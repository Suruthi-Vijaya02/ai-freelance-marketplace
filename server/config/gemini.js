import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.6-flash';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;

let geminiClient = null;

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    const error = new Error(
      'GEMINI_API_KEY is not set.'
    );
    error.code = 'GEMINI_MISSING_API_KEY';
    throw error;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}