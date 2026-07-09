// Конфиг LLM (Gemini). Ключ из Google AI Studio / Cloud. Free tier поддерживает и текст, и аудио.
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
export const LLM_MODEL = process.env.LLM_MODEL ?? 'gemini-2.5-flash';

export const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

// Ослабляем safety-фильтры: медицинские симптомы / описание ДТП не должны блокироваться.
export const GEMINI_SAFETY = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map((category) => ({ category, threshold: 'BLOCK_NONE' }));

export function llmEnabled(): boolean {
  return !!GEMINI_API_KEY;
}
