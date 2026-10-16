/**
 * VIAR Chatbot Configuration & Safety Guard
 * 
 * Manages configuration and environment checks for the floating AI assistant.
 * Ensures the chatbot API key is never exposed to the client and that the
 * widget is never rendered in production if the key is missing.
 */

export interface ChatbotConfig {
  provider: string;
  model: string;
  maxCharsPerMessage: number;
  maxOutputTokens: number;
  maxHistoryMessages: number;
  dailyGlobalCap: number;
  tenMinuteRateLimit: number;
  dailyUserRateLimit: number;
}

let hasLoggedProductionWarning = false;

/**
 * Checks whether the chatbot is configured with a valid API key.
 * In production: If CHATBOT_API_KEY is missing, logs a clear warning and returns false
 * so the widget is not rendered to visitors.
 */
export function isChatbotConfigured(): boolean {
  const apiKey = process.env.CHATBOT_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      if (!hasLoggedProductionWarning) {
        console.warn(
          '[Chatbot Warning] CHATBOT_API_KEY is missing in production environment. ' +
          'The floating AI assistant widget will NOT be rendered to visitors to prevent showing a broken interface.'
        );
        hasLoggedProductionWarning = true;
      }
      return false;
    }
    // In development/test environments, return false if no key
    return false;
  }

  return true;
}

/**
 * Returns the active chatbot configuration limits and parameters.
 */
export function getChatbotConfig(): ChatbotConfig {
  return {
    provider: (process.env.CHATBOT_PROVIDER || 'openai').toLowerCase(),
    model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
    maxCharsPerMessage: 500,
    maxOutputTokens: 400,
    maxHistoryMessages: 8,
    dailyGlobalCap: parseInt(process.env.CHATBOT_DAILY_MESSAGE_CAP || '1000', 10),
    tenMinuteRateLimit: 15,
    dailyUserRateLimit: 100,
  };
}

/**
 * Helper to reset logged warning flag for test environments
 */
export function _resetWarningFlagForTesting(): void {
  hasLoggedProductionWarning = false;
}
