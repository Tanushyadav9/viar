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
  ExternalLink,
  Bot,
  User,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { ActionButton, generateGroundedAssistantResponse } from '@/lib/ai/assistantEngine';

interface ChatMessage {
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
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Route Suppression: Hide completely on protected student/admin/instructor portals
  const isProtectedPortal =
    !pathname ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor');

  // Initial Welcome Message
  const getInitialMessage = useCallback((): ChatMessage => {
    return {
      id: 'welcome-init',
      sender: 'assistant',
      text: isHi
        ? 'नमस्ते! 🙏 मैं विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) का AI शैक्षणिक सहायक हूँ। आप मुझसे हमारे 23-मॉड्यूल वैदिक ज्योतिष कोर्स, ₹5,100 शिक्षण शुल्क, पाठ्यक्रम, आचार्य नीरज कुमार जी, या प्रवेश प्रक्रिया के बारे में कुछ भी पूछ सकते हैं। आप English, हिंदी या Hinglish में प्रश्न पूछ सकते हैं!'
        : 'Namaste! 🙏 I am your VIAR Academic Assistant. I can answer any questions about our 23-module Vedic Astrology masterclass, the ₹5,100 INR one-time tuition, syllabus, Acharya Niraj Kumar, and the enrollment process. Feel free to ask in English, हिंदी, or Hinglish!',
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

  // Load chat history or set initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getInitialMessage()]);
    }
  }, [getInitialMessage, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Keyboard accessibility: ESC closes chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Send Message Handler with Real-Time Streaming and Rate Limit Handling
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Strict 500 characters limit
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
      // Call Streaming Server Route /api/chat with last 8 messages as context
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
            ? 'आपने बातचीत की सीमा पार कर ली है। कृपया त्वरित सहायता के लिए व्हाट्सएप पर संपर्क करें।'
            : "You've reached the conversation limit. Please chat directly with our team on WhatsApp for instant assistance.");

        const actionButtons: ActionButton[] = errorData?.actionButtons || [
          {
            label: isHi ? 'व्हाट्सएप पर संपर्क करें' : 'Chat on WhatsApp (+91 93112 15564)',
            url: 'https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20have%20an%20inquiry%20regarding%20the%20VIAR%20Astrology%20Course.',
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

      // Handle Server Unavailable (503)
      if (res.status === 503) {
        const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
        setMessages((prev) => [
          ...prev,
          {
            id: asstId,
            sender: 'assistant',
            text: fallback.reply,
            timestamp,
            actionButtons: fallback.actionButtons,
          },
        ]);
        return;
      }

      // Handle Successful Streaming (200)
      if (res.ok && res.body) {
        // Create initial placeholder assistant message in state
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
            prev.map((m) =>
              m.id === asstId ? { ...m, text: accumulatedText } : m
            )
          );
        }

        // Attach contextual action buttons after completion
        const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, actionButtons: fallback.actionButtons } : m
          )
        );
      } else {
        // Fallback to deterministic grounded engine on HTTP non-200
        const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
        setMessages((prev) => [
          ...prev,
          {
            id: asstId,
            sender: 'assistant',
            text: fallback.reply,
            timestamp,
            actionButtons: fallback.actionButtons,
          },
        ]);
      }
    } catch {
      // Fallback to deterministic grounded engine on network/offline error
      const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
      setMessages((prev) => [
        ...prev,
        {
          id: asstId,
          sender: 'assistant',
          text: fallback.reply,
          timestamp,
          actionButtons: fallback.actionButtons,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Suggested Prompt Pills
  const suggestedPrompts = isHi
    ? [
        'कोर्स की फीस क्या है?',
        '23 मॉड्यूल में क्या सिखाते हैं?',
        'क्या यह लाइव है या रिकॉर्डेड?',
        'क्या सर्टिफिकेट मिलेगा?',
        'आचार्य जी से बात करनी है',
      ]
    : [
        'What is the course fee?',
        'What is in the 23-module syllabus?',
        'Is it self-paced or live Zoom?',
        'Do I get a verifiable certificate?',
        'Talk to Acharya Niraj Kumar',
      ];

  // Safety Guard & Route Suppression:
  // 1. Do not render widget if not configured with valid API key (never show broken chatbot)
  // 2. Hide completely on protected student/admin/instructor portals
  if (!isConfigured || isProtectedPortal) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING TRIGGER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <aside aria-label="VIAR AI Assistant" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-controls="viar-ai-chat-window"
            aria-label={isHi ? 'विहंगम ज्योतिष सहायक खोलें' : 'Open VIAR AI Assistant'}
            className="group relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold shadow-2xl shadow-amber-500/35 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-400/50"
          >
            {/* Pulsing Beacon */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-950"></span>
            </span>

            {/* Sparkle Icon */}
            <div className="w-6 h-6 rounded-full bg-slate-950/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>

            {/* Label */}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                {isHi ? 'ज्योतिष सहायक' : 'Ask VIAR AI'}
              </span>
              <span className="text-[10px] font-medium text-slate-900/80 hidden sm:inline">
                {isHi ? 'शुल्क • पाठ्यक्रम • सहायता' : 'Fees • Syllabus • Instant Help'}
              </span>
            </div>

            {/* Unread dot */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-950"></span>
            )}
          </button>
        </aside>
      )}

      {/* 2. CHAT WINDOW MODAL / DRAWER */}
      {isOpen && (
        <section
          id="viar-ai-chat-window"
          role="dialog"
          aria-modal="false"
          aria-label={isHi ? 'विहंगम ज्योतिष शैक्षणिक सहायक' : 'VIAR Academic AI Assistant'}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[85vh] rounded-2xl bg-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-500/20 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950/40 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {isHi ? 'विहंगम शैक्षणिक सहायक' : 'VIAR Academic AI'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <span className="text-[11px] text-amber-300/80">
                  {isHi ? 'वैदिक ज्योतिष मास्टरक्लास • ₹5,100' : 'Vedic Astrology Masterclass • ₹5,100'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label={isHi ? 'चैट विंडो बंद करें' : 'Close chat window'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm custom-scrollbar"
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3 rounded-2xl ${
                        isUser
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none leading-relaxed'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>

                    {/* Action Buttons if attached */}
                    {!isUser && m.actionButtons && m.actionButtons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                                isEnroll
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                  : isWhatsApp
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                  : isCall
                                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {isWhatsApp && <MessageCircle className="w-3.5 h-3.5" />}
                              {isCall && <Phone className="w-3.5 h-3.5" />}
                              {isEnroll && <GraduationCap className="w-3.5 h-3.5" />}
                              <span>{btn.label}</span>
                              {btn.isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-70" />}
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

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 text-[11px] font-medium transition disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form with 500 characters limit */}
          <div className="p-3 bg-slate-950 border-t border-white/10">
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
                      : 'Ask about fee, syllabus, or Acharya ji... (EN/हिं/Hinglish)'
                  }
                  maxLength={500}
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-900/80 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
                {inputText.length > 0 && (
                  <span className="absolute right-2.5 top-3 text-[10px] text-slate-500 font-mono">
                    {500 - inputText.length}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label={isHi ? 'संदेश भेजें' : 'Send message'}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:hover:opacity-40 disabled:active:scale-100 transition shadow-md shadow-amber-500/20"
              >
                <Send className="w-4 h-4 text-slate-950" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>{isHi ? 'सटीक उत्तर • zero hallucination' : 'Grounded in VIAR course facts'}</span>
              <span>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/80 hover:text-amber-300 underline"
                >
                  WhatsApp: +91 93112 15564
                </a>
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
