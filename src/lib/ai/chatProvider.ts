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
 * Allows effortless swapping between providers (OpenAI, Neon AI Gateway, Mock, etc.).
 */
export function getChatProvider(customProvider?: string): ChatProvider {
  const providerName = (
    customProvider ||
    process.env.CHATBOT_PROVIDER ||
    'openai'
  ).toLowerCase();

  switch (providerName) {
    case 'mock':
      return new MockChatProvider();
    case 'neon':
      return new OpenAIChatProvider({
        name: 'neon',
        baseUrl: process.env.NEON_AI_GATEWAY_BASE_URL,
        apiKey: process.env.NEON_AI_GATEWAY_TOKEN || process.env.CHATBOT_API_KEY,
        model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
      });
    case 'openai':
    default:
      return new OpenAIChatProvider({
        name: 'openai',
        apiKey: process.env.CHATBOT_API_KEY,
        model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
      });
  }
}
