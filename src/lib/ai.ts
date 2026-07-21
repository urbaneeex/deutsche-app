import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type AIProvider = "groq" | "openai";

export function getAIProvider(): AIProvider | null {
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

export function getAIModel(provider: AIProvider): string {
  if (provider === "groq") {
    return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  }
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getAIClient(): OpenAI {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error(
      "Falta GROQ_API_KEY (recomendado) u OPENAI_API_KEY en .env.local."
    );
  }

  if (provider === "groq") {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
    });
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Mensaje amigable si Groq/OpenAI devuelve 429 por rate limit. */
export function formatAIError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return "Límite de peticiones de la IA alcanzado. Espera un minuto o prueba más tarde.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido al llamar a la IA.";
}
