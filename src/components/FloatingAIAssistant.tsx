'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Send,
  MessageCircle,
  Phone,
  GraduationCap,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { ActionButton, generateGroundedAssistantResponse } from '@/lib/ai/assistantEngine';
import {
  shouldSuppressAssistant,
  SUGGESTED_QUESTION_CHIPS,
  buildEscalationWhatsAppUrl,
  renderSafeMarkdown,
} from '@/lib/ai/safeMarkdown';

const SESSION_STORAGE_KEY = 'viar_ai_chat_session';

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actionButtons?: ActionButton[];
}

interface FloatingAIAssistantProps {
  isConfigured?: boolean;
}

export default function FloatingAIAssistant({ isConfigured = true }: FloatingAIAssistantProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // 1. Route Suppression: Hide on /admin, /dashboard, /instructor, /checkout
  const isSuppressed = shouldSuppressAssistant(pathname);

  // 2. Initial Welcome Greeting
  const getInitialMessage = useCallback((): ChatMessage => {
    return {
      id: 'welcome-init',
      sender: 'assistant',
      text: isHi
        ? 'नमस्ते! 🙏 मैं विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) का AI शैक्षणिक सहायक हूँ। आप मुझसे हमारे 23-मॉड्यूल वैदिक ज्योतिष कोर्स, ₹5,100 शिक्षण शुल्क, पाठ्यक्रम, आचार्य नीरज कुमार जी, या प्रवेश प्रक्रिया के बारे में कुछ भी पूछ सकते हैं। आप English, हिंदी या Hinglish में प्रश्न पूछ सकते हैं!'
        : 'Namaste! 🙏 I am your VIAR Academic Assistant. I can answer any questions about our 23-module Vedic Astrology masterclass, the ₹5,100 INR tuition, syllabus, Acharya Niraj Kumar, and the enrollment process. Feel free to ask in English, हिंदी, or Hinglish!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionButtons: [
        {
          label: isHi ? 'कोर्स में प्रवेश लें (₹5,100)' : 'Enroll in Course (₹5,100)',
          url: '/checkout?course=what-is-astrology',
          type: 'enroll',
          variant: 'accent',
        },
        {
          label: isHi ? 'व्हाट्सएप पर बात करें' : 'Chat on WhatsApp',
          url: 'https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20have%20an%20inquiry%20regarding%20the%20VIAR%20Astrology%20Course.',
          isExternal: true,
          type: 'whatsapp',
          variant: 'primary',
        },
      ],
    };
  }, [isHi]);

  // 3. Load conversation from sessionStorage only (Zero localStorage usage)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setIsInitialized(true);
            return;
          }
        }
      }
    } catch {
      // Fallback if sessionStorage is disabled or corrupted
    }

    setMessages([getInitialMessage()]);
    setIsInitialized(true);
  }, [getInitialMessage]);

  // 4. Save messages to sessionStorage whenever updated
  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {
      // Storage quota or privacy mode exception
    }
  }, [messages, isInitialized]);

  // 5. Auto-scroll to bottom of messages container
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // 6. Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // 7. Keyboard Accessibility: Focus Trap & Escape to Close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes dialog and restores focus to trigger button
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 8. "New chat" Handler (Resets session and conversation)
  const handleNewChat = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
    setMessages([getInitialMessage()]);
    setInputText('');
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [getInitialMessage]);

  // 9. Send Message Handler with Streaming, 500 Char Cap & Error Handling
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Strict 500 character limit
    if (text.length > 500) return;

    setInputText('');

    // Add user message to state
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const asstId = `asst-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      // Context window strictly capped to last 8 messages
      const historyContext = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyContext,
        }),
      });

      // Handle Rate Limiting (429) Friendly Message with WhatsApp Button
      if (res.status === 429) {
        const errorData = await res.json().catch(() => null);
        const limitReply =
          errorData?.message ||
          (isHi
            ? 'आपने संदेश भेजने की सीमा पार कर ली है। कृपया त्वरित सहायता के लिए आचार्य जी से सीधे व्हाट्सएप पर संपर्क करें।'
            : "You have reached the conversation rate limit. Please connect directly with Acharya Niraj Kumar on WhatsApp for immediate support.");

        const actionButtons: ActionButton[] = [
          {
            label: isHi ? 'व्हाट्सएप पर संपर्क करें' : 'Chat on WhatsApp (+91 93112 15564)',
            url: buildEscalationWhatsAppUrl(text, isHi),
            isExternal: true,
            type: 'whatsapp',
            variant: 'primary',
          },
        ];

        setMessages((prev) => [
          ...prev,
          {
            id: asstId,
            sender: 'assistant',
            text: limitReply,
            timestamp,
            actionButtons,
          },
        ]);
        return;
      }

      // Handle Successful Streaming (200)
      if (res.ok && res.body) {
        setMessages((prev) => [
          ...prev,
          {
            id: asstId,
            sender: 'assistant',
            text: '',
            timestamp,
          },
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, text: accumulatedText } : m))
          );
        }

        // Contextual action buttons after completion
        const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, actionButtons: fallback.actionButtons } : m
          )
        );
      } else {
        // HTTP 500, 502, 503, 504 -> Friendly message with direct WhatsApp escalation
        const errorReply = isHi
          ? 'वर्तमान में संपर्क स्थापित करने में समस्या आ रही है। कृपया त्वरित सहायता के लिए आचार्य नीरज कुमार जी से सीधे व्हाट्सएप (+91 93112 15564) पर संपर्क करें।'
          : "I am having trouble connecting right now. Please reach out to Acharya Niraj Kumar directly on WhatsApp (+91 93112 15564) or call for immediate assistance.";

        setMessages((prev) => [
          ...prev,
          {
            id: asstId,
            sender: 'assistant',
            text: errorReply,
            timestamp,
            actionButtons: [
              {
                label: isHi ? 'व्हाट्सएप पर पूछें' : 'Chat on WhatsApp',
                url: buildEscalationWhatsAppUrl(text, isHi),
                isExternal: true,
                type: 'whatsapp',
                variant: 'primary',
              },
            ],
          },
        ]);
      }
    } catch {
      // Network failure / offline error -> Friendly message with direct WhatsApp escalation
      const errorReply = isHi
        ? 'नेटवर्क संपर्क में समस्या आ रही है। कृपया त्वरित सहायता के लिए व्हाट्सएप (+91 93112 15564) पर संपर्क करें।'
        : "Network connection error. Please connect directly on WhatsApp (+91 93112 15564) for immediate assistance.";

      setMessages((prev) => [
        ...prev,
        {
          id: asstId,
          sender: 'assistant',
          text: errorReply,
          timestamp,
          actionButtons: [
            {
              label: isHi ? 'व्हाट्सएप पर पूछें' : 'Chat on WhatsApp',
              url: buildEscalationWhatsAppUrl(text, isHi),
              isExternal: true,
              type: 'whatsapp',
              variant: 'primary',
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Find last question asked by user for pre-filled WhatsApp escalation
  const lastUserQuestion = [...messages].reverse().find((m) => m.sender === 'user')?.text;
  const escalationWhatsAppUrl = buildEscalationWhatsAppUrl(lastUserQuestion, isHi);

  // Suggested Chips (Exact 4 chips)
  const suggestedChips = isHi ? SUGGESTED_QUESTION_CHIPS.hi : SUGGESTED_QUESTION_CHIPS.en;

  // Route Suppression or Missing Config Guard (Never show broken chatbot)
  if (!isConfigured || isSuppressed) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING TRIGGER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <aside
          aria-label={isHi ? 'विहंगम ज्योतिष सहायक' : 'VIAR AI Assistant'}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 motion-reduce:transition-none"
        >
          <button
            ref={triggerButtonRef}
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-controls="viar-ai-chat-window"
            aria-label={isHi ? 'विहंगम ज्योतिष सहायक खोलें' : 'Open VIAR AI Assistant'}
            className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            {/* Pulsing Beacon */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
            </span>

            {/* Sparkle Icon */}
            <div className="w-5 h-5 rounded-full bg-slate-950/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse motion-reduce:animate-none" />
            </div>

            {/* Accessible Text Label in Site Brand Style */}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                {isHi ? 'ज्योतिष सहायक' : 'Ask VIAR AI'}
              </span>
              <span className="text-[10px] font-medium text-slate-900/80 hidden sm:inline">
                {isHi ? 'शुल्क • पाठ्यक्रम • सहायता' : 'Fees • Syllabus • Help'}
              </span>
            </div>
          </button>
        </aside>
      )}

      {/* 2. CHAT PANEL (Desktop: 380×560; Mobile: Full-Height Sheet) */}
      {isOpen && (
        <section
          ref={dialogRef}
          id="viar-ai-chat-window"
          role="dialog"
          aria-modal="true"
          aria-label={isHi ? 'विहंगम ज्योतिष एआई सहायक' : 'VIAR AI Assistant'}
          className="fixed inset-0 sm:inset-auto bottom-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-full sm:h-[560px] rounded-none sm:rounded-2xl z-50 flex flex-col bg-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-500/20 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 motion-reduce:animate-none"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-950/30 border-b border-amber-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Bot className="w-4 h-4 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {isHi ? 'विहंगम एआई सहायक' : 'VIAR AI Assistant'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {isHi ? 'एआई सहायक' : 'AI assistant'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-300/80">
                  {isHi ? 'वैदिक ज्योतिष मास्टरक्लास • ₹5,100' : 'Vedic Astrology Masterclass • ₹5,100'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* "New chat" button */}
              <button
                onClick={handleNewChat}
                aria-label={isHi ? 'नई बातचीत शुरू करें' : 'Start new chat'}
                title={isHi ? 'नई बातचीत शुरू करें' : 'Start new chat'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  triggerButtonRef.current?.focus();
                }}
                aria-label={isHi ? 'सहायक बंद करें' : 'Close assistant'}
                title={isHi ? 'सहायक बंद करें' : 'Close assistant'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area (aria-live="polite" for screen reader announcements) */}
          <div
            className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs sm:text-sm custom-scrollbar"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className={`p-3 rounded-2xl ${
                        isUser
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none leading-relaxed'
                      }`}
                    >
                      {/* Safe text/markdown rendering (no raw HTML) */}
                      {isUser ? (
                        <p className="whitespace-pre-line">{m.text}</p>
                      ) : (
                        renderSafeMarkdown(m.text)
                      )}
                    </div>

                    {/* Contextual Action Buttons */}
                    {!isUser && m.actionButtons && m.actionButtons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.actionButtons.map((btn, idx) => {
                          const isWhatsApp = btn.type === 'whatsapp';
                          const isCall = btn.type === 'call';
                          const isEnroll = btn.type === 'enroll';

                          return (
                            <Link
                              key={`${btn.label}-${idx}`}
                              href={btn.url}
                              target={btn.isExternal ? '_blank' : undefined}
                              rel={btn.isExternal ? 'noopener noreferrer' : undefined}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                isEnroll
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                  : isWhatsApp
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                  : isCall
                                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {isWhatsApp && <MessageCircle className="w-3 h-3" />}
                              {isCall && <Phone className="w-3 h-3" />}
                              {isEnroll && <GraduationCap className="w-3 h-3" />}
                              <span>{btn.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    <span
                      className={`block text-[10px] text-slate-500 ${
                        isUser ? 'text-right' : 'text-left'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-950" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Four Suggested-Question Chips (Shown right after initial greeting) */}
            {messages.length <= 2 && (
              <div className="pt-1 pb-2 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  {isHi ? 'सुझाए गए प्रश्न:' : 'Suggested questions:'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      disabled={isLoading}
                      className="p-2 rounded-xl text-left bg-slate-900/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 text-xs font-medium transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin motion-reduce:animate-none" />
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce motion-reduce:animate-none"></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Escalation Bar (Always available: WhatsApp pre-filled with last inquiry, Call, Booking link) */}
          <div className="px-3 py-1.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between gap-1 shrink-0 text-[11px]">
            <span className="text-[10px] text-slate-400 font-medium">
              {isHi ? 'सहायता:' : 'Assistance:'}
            </span>

            <div className="flex items-center gap-1.5">
              {/* WhatsApp (Pre-filled with visitor's last inquiry) */}
              <a
                href={escalationWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={isHi ? 'व्हाट्सएप पर पूछें' : 'Ask on WhatsApp'}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              {/* Call */}
              <a
                href="tel:+919311215564"
                title={isHi ? 'कॉल करें' : 'Call'}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              >
                <Phone className="w-3 h-3 text-sky-400" />
                <span>{isHi ? 'कॉल' : 'Call'}</span>
              </a>

              {/* Booking / Checkout link */}
              <Link
                href="/checkout?course=what-is-astrology"
                title={isHi ? 'प्रवेश लें' : 'Enroll in course'}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
              >
                <GraduationCap className="w-3 h-3 text-amber-400" />
                <span>{isHi ? 'प्रवेश' : 'Enroll'}</span>
              </Link>
            </div>
          </div>

          {/* Input Form with 500 characters limit */}
          <div className="p-3 bg-slate-950 border-t border-white/10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isHi
                      ? 'फीस, सिलेबस, या प्रवेश के बारे में पूछें...'
                      : 'Ask fee, syllabus, Acharya ji... (EN/हिं/Hinglish)'
                  }
                  maxLength={500}
                  disabled={isLoading}
                  className="w-full pl-3 pr-8 py-2 bg-slate-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition"
                />
                {inputText.length > 0 && (
                  <span className="absolute right-2 top-2.5 text-[9px] text-slate-500 font-mono">
                    {500 - inputText.length}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label={isHi ? 'संदेश भेजें' : 'Send message'}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:hover:opacity-40 disabled:active:scale-100 transition shadow-md shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Send className="w-4 h-4 text-slate-950" />
              </button>
            </form>

            {/* Mandatory Footer Note with Privacy Policy Link */}
            <p className="mt-2 text-[10px] text-slate-400 text-center leading-normal">
              {isHi ? (
                <>
                  एआई सहायक। उत्तर अपूर्ण हो सकते हैं। व्यक्तिगत मार्गदर्शन के लिए{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-amber-400 underline underline-offset-1 hover:text-amber-300 focus-visible:ring-1 focus-visible:ring-amber-400 rounded-sm"
                  >
                    संपर्क करें एवं गोपनीयता नीति देखें
                  </Link>
                  ।
                </>
              ) : (
                <>
                  AI assistant. Answers may be imperfect. For personal guidance please contact us.{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-amber-400 underline underline-offset-1 hover:text-amber-300 focus-visible:ring-1 focus-visible:ring-amber-400 rounded-sm"
                  >
                    Privacy Policy
                  </Link>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Screen Reader Live Region */}
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="true">
        {messages.length > 0 && messages[messages.length - 1].sender === 'assistant'
          ? messages[messages.length - 1].text
          : ''}
      </div>
    </>
  );
}
