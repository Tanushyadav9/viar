import { NextRequest, NextResponse } from 'next/server';
import { isChatbotConfigured, getChatbotConfig } from '@/lib/ai/chatbotConfig';
import {
  hashClientIdentifier,
  checkChatRateLimit,
  recordChatUsage,
} from '@/lib/ai/rateLimiter';
import { getChatProvider, ChatMessage } from '@/lib/ai/chatProvider';
import { GROUNDED_VIAR_SYSTEM_PROMPT, VIAR_ACADEMY_FACTS } from '@/lib/ai/knowledgeBase';

export const runtime = 'nodejs';

/**
 * GET /api/chat
 * Status endpoint to check whether the chatbot is active and ready.
 * NEVER returns secrets or API keys.
 */
export async function GET() {
  const configured = isChatbotConfigured();
  const config = getChatbotConfig();

  return NextResponse.json({
    enabled: configured,
    provider: configured ? config.provider : null,
    model: configured ? config.model : null,
    limits: {
      maxCharsPerMessage: config.maxCharsPerMessage,
      maxOutputTokens: config.maxOutputTokens,
      maxHistoryMessages: config.maxHistoryMessages,
    },
  });
}

/**
 * POST /api/chat
 * Primary streaming endpoint for model chat completion.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Chatbot Configuration (Never show broken chatbot)
    if (!isChatbotConfigured()) {
      return NextResponse.json(
        {
          error: 'chatbot_not_configured',
          message: 'The AI assistant is currently unavailable. Please connect directly on WhatsApp (+91 93112 15564).',
          actionButtons: [
            {
              label: 'Chat on WhatsApp',
              url: VIAR_ACADEMY_FACTS.contacts.whatsappUrl,
              isExternal: true,
              type: 'whatsapp',
              variant: 'primary',
            },
          ],
        },
        { status: 503 }
      );
    }

    // 2. Client Identification & Rate Limiting (Hashed IP & Session only)
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous';
    const sessionHeader = req.headers.get('x-chatbot-session') || '';
    const hashedId = hashClientIdentifier(rawIp, sessionHeader);

    const rateCheck = checkChatRateLimit(hashedId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          reason: rateCheck.reason,
          message: rateCheck.message,
          actionButtons: [
            {
              label: 'Chat on WhatsApp (+91 93112 15564)',
              url: VIAR_ACADEMY_FACTS.contacts.whatsappUrl,
              isExternal: true,
              type: 'whatsapp',
              variant: 'primary',
            },
            {
              label: 'Call +91 93112 15564',
              url: VIAR_ACADEMY_FACTS.contacts.phoneTel,
              isExternal: true,
              type: 'call',
              variant: 'outline',
            },
          ],
        },
        {
          status: 429,
          headers: rateCheck.retryAfterSeconds
            ? { 'Retry-After': String(rateCheck.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    // 3. Request Body Parsing & Strict Size Validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Field "message" string is required.' },
        { status: 400 }
      );
    }

    const config = getChatbotConfig();
    const rawMessage = body.message.trim();

    if (rawMessage.length === 0) {
      return NextResponse.json(
        { error: 'empty_message', message: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (rawMessage.length > config.maxCharsPerMessage) {
      return NextResponse.json(
        {
          error: 'message_too_long',
          message: `Message exceeds maximum allowed length of ${config.maxCharsPerMessage} characters.`,
        },
        { status: 400 }
      );
    }

    // 4. Build Context Window (Strictly capped to last 8 messages)
    const messages: ChatMessage[] = [
      { role: 'system', content: GROUNDED_VIAR_SYSTEM_PROMPT },
    ];

    if (Array.isArray(body.history)) {
      const recentHistory = body.history.slice(-config.maxHistoryMessages);
      for (const item of recentHistory) {
        if (
          item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string'
        ) {
          messages.push({
            role: item.role,
            content: item.content.slice(0, config.maxCharsPerMessage),
          });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: rawMessage });

    // 5. Sensible Function Timeout (15 seconds)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 15000);

    // 6. Invoke ChatProvider Streaming
    const provider = getChatProvider();
    let textStream: ReadableStream<string>;

    try {
      textStream = await provider.streamChat({
        messages,
        maxTokens: config.maxOutputTokens, // ~400 output tokens
        temperature: 0.1, // Strict deterministic grounding
        abortSignal: abortController.signal,
      });

      // Record rate limit usage on successful start
      recordChatUsage(hashedId);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.includes('aborted'));

      if (isAbort) {
        return NextResponse.json(
          {
            error: 'gateway_timeout',
            message: 'Response generation timed out. Please connect on WhatsApp (+91 93112 15564) for immediate assistance.',
          },
          { status: 504 }
        );
      }

      console.error('[Chat API Provider Error]:', err);
      return NextResponse.json(
        {
          error: 'provider_error',
          message: 'Unable to contact the AI model. Please connect directly on WhatsApp (+91 93112 15564).',
          actionButtons: [
            {
              label: 'Chat on WhatsApp',
              url: VIAR_ACADEMY_FACTS.contacts.whatsappUrl,
              isExternal: true,
              type: 'whatsapp',
              variant: 'primary',
            },
          ],
        },
        { status: 502 }
      );
    }

    // 7. Encode and Stream to Client
    const encoder = new TextEncoder();
    const reader = textStream.getReader();

    const responseStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timeoutId);
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(value));
        } catch (err) {
          clearTimeout(timeoutId);
          controller.error(err);
        }
      },
      cancel() {
        clearTimeout(timeoutId);
        abortController.abort();
        reader.cancel().catch(() => {});
      },
    });

    return new Response(responseStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Chat API Unexpected Error]:', error);
    return NextResponse.json(
      {
        error: 'internal_server_error',
        message: 'An unexpected error occurred. Please contact us on WhatsApp (+91 93112 15564).',
        actionButtons: [
          {
            label: 'Chat on WhatsApp',
            url: VIAR_ACADEMY_FACTS.contacts.whatsappUrl,
            isExternal: true,
            type: 'whatsapp',
            variant: 'primary',
          },
        ],
      },
      { status: 500 }
    );
  }
}
