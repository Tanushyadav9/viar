import { NextRequest, NextResponse } from 'next/server';
import {
  generateGroundedAssistantResponse,
  identifyIntent,
  ActionButton,
} from '@/lib/ai/assistantEngine';
import { GROUNDED_VIAR_SYSTEM_PROMPT, VIAR_ACADEMY_FACTS } from '@/lib/ai/knowledgeBase';
import {
  getLiveAcademyData,
  retrieveRelevantKnowledgeContext,
  logUnansweredQuestion,
} from '@/lib/ai/knowledgeRetriever';

export const runtime = 'nodejs';

// Simple in-memory sliding rate limiter (25 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before sending another message.',
          reply: 'You are sending messages too quickly. Please wait a minute or connect directly with Acharya Niraj Kumar on WhatsApp (+91 93112 15564).',
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
        { status: 429 }
      );
    }

    // 2. Parse & Validate Body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body. "message" string is required.' },
        { status: 400 }
      );
    }

    const rawMessage = body.message.trim();
    if (rawMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (rawMessage.length > 500) {
      return NextResponse.json(
        { error: 'Message exceeds 500 characters limit.' },
        { status: 400 }
      );
    }

    const locale = typeof body.locale === 'string' ? body.locale : undefined;

    // Retrieve live academy data & context from PostgreSQL
    const liveData = await getLiveAcademyData().catch(() => null);
    const relevantContext = liveData
      ? retrieveRelevantKnowledgeContext(rawMessage, liveData)
      : null;

    // Check if an Owner-published knowledge entry matches the user's inquiry
    if (liveData?.customKnowledgeEntries && liveData.customKnowledgeEntries.length > 0) {
      const normUser = rawMessage.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
      const customMatch = liveData.customKnowledgeEntries.find((entry) => {
        const normEntryQ = entry.question.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
        return (
          normEntryQ === normUser ||
          (normEntryQ.length > 5 && normUser.includes(normEntryQ)) ||
          (normUser.length > 5 && normEntryQ.includes(normUser))
        );
      });

      if (customMatch) {
        return NextResponse.json({
          reply: customMatch.answer,
          actionButtons: [
            {
              label: 'Chat on WhatsApp',
              url: VIAR_ACADEMY_FACTS.contacts.whatsappUrl,
              isExternal: true,
              type: 'whatsapp',
              variant: 'primary',
            },
            {
              label: 'Enroll Now (₹5,100)',
              url: '/checkout?course=what-is-astrology',
              isExternal: false,
              type: 'enroll',
              variant: 'secondary',
            },
          ],
          language: locale || 'en',
          intent: 'custom_knowledge',
          confidence: 'high',
          source: 'knowledge_base',
        });
      }
    }

    // 3. Check for Optional LLM Provider (Neon AI Gateway, OpenAI)
    const neonGatewayToken = process.env.NEON_AI_GATEWAY_TOKEN;
    const neonGatewayBaseUrl = process.env.NEON_AI_GATEWAY_BASE_URL;
    const openAiKey = process.env.OPENAI_API_KEY;

    let llmResponseText: string | null = null;

    if ((neonGatewayToken && neonGatewayBaseUrl) || openAiKey) {
      try {
        const endpoint = neonGatewayBaseUrl
          ? `${neonGatewayBaseUrl.replace(/\/+$/, '')}/v1/chat/completions`
          : 'https://api.openai.com/v1/chat/completions';
        const bearerToken = neonGatewayToken || openAiKey;

        // Build messages array with live context grounding
        const systemPrompt = relevantContext?.contextText
          ? `${GROUNDED_VIAR_SYSTEM_PROMPT}\n\n${relevantContext.contextText}`
          : GROUNDED_VIAR_SYSTEM_PROMPT;

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        // Append recent history if provided
        if (Array.isArray(body.history)) {
          const recentHistory = body.history.slice(-4);
          for (const item of recentHistory) {
            if (
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string'
            ) {
              messages.push({
                role: item.role,
                content: item.content.slice(0, 300),
              });
            }
          }
        }

        messages.push({ role: 'user', content: rawMessage });

        // Controller with 4-second timeout for snappy user experience
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const llmRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify({
            model: neonGatewayBaseUrl ? 'gpt-5-mini' : 'gpt-4o-mini',
            messages,
            temperature: 0.1, // Strict deterministic grounding
            max_tokens: 350,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (llmRes.ok) {
          const data = await llmRes.json();
          const content = data?.choices?.[0]?.message?.content?.trim();
          if (content) {
            llmResponseText = content;
          }
        }
      } catch (err) {
        // Fall back gracefully to the deterministic grounded engine
        console.warn('[AI Assistant] LLM call failed or timed out, falling back to grounded engine:', err);
      }
    }

    // 4. Generate Response
    // If LLM produced a grounded response, attach action buttons
    if (llmResponseText) {
      const intent = identifyIntent(rawMessage);
      const fallbackData = generateGroundedAssistantResponse(rawMessage, { locale });

      // Determine appropriate action buttons
      const actionButtons: ActionButton[] = fallbackData.actionButtons;

      return NextResponse.json({
        reply: llmResponseText,
        actionButtons,
        language: fallbackData.language,
        intent,
        source: 'llm',
      });
    }

    // 5. Zero-Cost, Deterministic Grounded Engine Response
    const groundedResult = generateGroundedAssistantResponse(rawMessage, { locale });

    // If response is fallback or out of scope, persist masked inquiry for Owner review in /admin/knowledge
    if (groundedResult.confidence === 'fallback' || groundedResult.intent === 'fallback') {
      await logUnansweredQuestion(rawMessage, groundedResult.language).catch(() => {});
    }

    return NextResponse.json({
      reply: groundedResult.reply,
      actionButtons: groundedResult.actionButtons,
      language: groundedResult.language,
      intent: groundedResult.intent,
      confidence: groundedResult.confidence,
      source: 'grounded_engine',
    });
  } catch (error) {
    console.error('[AI Assistant API Error]:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred.',
        reply: 'I encountered a temporary issue. Please connect with Acharya Niraj Kumar directly on WhatsApp (+91 93112 15564) or try again.',
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
