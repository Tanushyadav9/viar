/**
 * VIAR Chat Provider Abstraction Layer
 * 
 * Defines a clean, swappable interface for LLM completion providers.
 * All model calls are routed through this interface.
 * 
 * Model Selection Policy:
 * Fast, low-cost model on a paid tier with training on customer data disabled
 * (e.g. OpenAI gpt-4o-mini on paid API tier).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  maxTokens?: number; // ~400 output tokens
  temperature?: number; // ~0.1 for strict grounding
  abortSignal?: AbortSignal;
}

export interface ChatProvider {
  readonly name: string;
  readonly model: string;
  streamChat(options: ChatCompletionOptions): Promise<ReadableStream<string>>;
}

/**
 * OpenAI Chat Provider
 * Supports official OpenAI API or any OpenAI-compatible endpoint (e.g. Neon AI Gateway).
 * Under OpenAI's Commercial API Terms of Service, data sent via API is NOT used to train models.
 */
export class OpenAIChatProvider implements ChatProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    name?: string;
  }) {
    this.name = options?.name || 'openai';
    this.apiKey = options?.apiKey || process.env.CHATBOT_API_KEY || '';
    this.model = options?.model || process.env.CHATBOT_MODEL || 'gpt-4o-mini';
    this.baseUrl = (
      options?.baseUrl ||
      process.env.CHATBOT_BASE_URL ||
      'https://api.openai.com/v1'
    ).replace(/\/+$/, '');
  }

  async streamChat(options: ChatCompletionOptions): Promise<ReadableStream<string>> {
    if (!this.apiKey) {
      throw new Error(
        `[${this.name}] Cannot stream chat: CHATBOT_API_KEY is not configured.`
      );
    }

    const endpoint = `${this.baseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 400,
        stream: true,
      }),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `[${this.name}] API request failed with status ${response.status}: ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error(`[${this.name}] Response body is null.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    return new ReadableStream<string>({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue; // SSE comment or empty line

              if (trimmed === 'data: [DONE]') {
                controller.close();
                return;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string' && delta.length > 0) {
                    controller.enqueue(delta);
                  }
                } catch {
                  // Ignore malformed chunks
                }
              }
            }
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }
}

/**
 * Google Gemini Chat Provider
 * Supports Google Gemini official OpenAI-compatible endpoint and native REST API.
 * Paid / API tiers do NOT use customer prompts or completions to train models.
 */
export class GeminiChatProvider implements ChatProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    name?: string;
  }) {
    this.name = options?.name || 'gemini';
    this.apiKey = options?.apiKey || process.env.CHATBOT_API_KEY || '';
    // Normalize model: default to gemini-1.5-flash if unset or if legacy gpt model was passed
    const rawModel = options?.model || process.env.CHATBOT_MODEL || 'gemini-1.5-flash';
    this.model = rawModel.startsWith('gpt-') ? 'gemini-1.5-flash' : rawModel;
    this.baseUrl = (
      options?.baseUrl ||
      'https://generativelanguage.googleapis.com/v1beta/openai'
    ).replace(/\/+$/, '');
  }

  async streamChat(options: ChatCompletionOptions): Promise<ReadableStream<string>> {
    if (!this.apiKey) {
      throw new Error(`[${this.name}] Cannot stream chat: CHATBOT_API_KEY is not configured.`);
    }

    // Try OpenAI-compatible endpoint first
    try {
      return await this.streamViaOpenAICompatible(options);
    } catch (openAiErr) {
      console.warn(`[${this.name}] OpenAI-compatible endpoint failed, attempting native REST fallback:`, openAiErr);
      return await this.streamViaNativeRest(options);
    }
  }

  private async streamViaOpenAICompatible(options: ChatCompletionOptions): Promise<ReadableStream<string>> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 400,
        stream: true,
      }),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    return new ReadableStream<string>({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed === 'data: [DONE]') {
                controller.close();
                return;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string' && delta.length > 0) {
                    controller.enqueue(delta);
                  }
                } catch {
                  // ignore malformed chunks
                }
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  private async streamViaNativeRest(options: ChatCompletionOptions): Promise<ReadableStream<string>> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.apiKey)}`;

    let systemInstruction = '';
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        systemInstruction += (systemInstruction ? '\n\n' : '') + msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.1,
        maxOutputTokens: options.maxTokens ?? 400,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini native REST failed with status ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Gemini native response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    return new ReadableStream<string>({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const candidate = parsed.candidates?.[0];
                  const parts = candidate?.content?.parts;
                  if (Array.isArray(parts)) {
                    for (const part of parts) {
                      if (typeof part.text === 'string' && part.text.length > 0) {
                        controller.enqueue(part.text);
                      }
                    }
                  }
                } catch {
                  // ignore malformed chunks
                }
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }
}

/**
 * Mock Chat Provider for automated testing and deterministic environments
 */
export class MockChatProvider implements ChatProvider {
  readonly name = 'mock';
  readonly model: string;
  private responseGenerator: (options: ChatCompletionOptions) => string[];

  constructor(options?: {
    model?: string;
    customChunks?: string[];
    responseGenerator?: (options: ChatCompletionOptions) => string[];
  }) {
    this.model = options?.model || 'mock-fast-model';
    this.responseGenerator =
      options?.responseGenerator ||
      (() => options?.customChunks || ['Namaste! ', 'Course fee is ', '₹5,100 INR.']);
  }

  async streamChat(options: ChatCompletionOptions): Promise<ReadableStream<string>> {
    const chunks = this.responseGenerator(options);
    return new ReadableStream<string>({
      async start(controller) {
        for (const chunk of chunks) {
          if (options.abortSignal?.aborted) {
            controller.error(new Error('Aborted'));
            return;
          }
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  }
}

/**
 * Factory to get the active ChatProvider based on environment configuration.
 * Allows effortless swapping between providers (OpenAI, Gemini, Neon AI Gateway, Mock, etc.).
 * Includes auto-detection for Google Gemini keys starting with 'AIzaSy'.
 */
export function getChatProvider(customProvider?: string): ChatProvider {
  const apiKey = process.env.CHATBOT_API_KEY || '';
  const configuredProvider = (
    customProvider ||
    process.env.CHATBOT_PROVIDER ||
    ''
  ).toLowerCase();

  // 1. Auto-detect Gemini if provider is gemini/google OR if API key starts with AIzaSy (universal Google API key prefix)
  const isGemini =
    configuredProvider === 'gemini' ||
    configuredProvider === 'google' ||
    apiKey.startsWith('AIzaSy');

  if (isGemini) {
    let model = process.env.CHATBOT_MODEL || 'gemini-1.5-flash';
    // If model was left as gpt-4o-mini or default openai model, safely map to gemini-1.5-flash
    if (model.startsWith('gpt-') || model.startsWith('text-')) {
      model = 'gemini-1.5-flash';
    }
    return new GeminiChatProvider({
      apiKey,
      model,
    });
  }

  // 2. Mock provider for testing
  if (configuredProvider === 'mock') {
    return new MockChatProvider();
  }

  // 3. Neon AI Gateway
  if (configuredProvider === 'neon') {
    return new OpenAIChatProvider({
      name: 'neon',
      baseUrl: process.env.NEON_AI_GATEWAY_BASE_URL,
      apiKey: process.env.NEON_AI_GATEWAY_TOKEN || apiKey,
      model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
    });
  }

  // 4. Default OpenAI
  return new OpenAIChatProvider({
    name: 'openai',
    apiKey,
    model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
  });
}
