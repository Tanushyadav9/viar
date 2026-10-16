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

export default function FloatingAIAssistant() {
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

  // 1. Route Suppression: Hide completely on protected student/admin/instructor portals
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

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

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

    try {
      // Call API Route
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          locale: isHi ? 'hi' : 'en',
          history: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Thank you for your question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButtons: data.actionButtons,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Fallback to client-side grounded engine on HTTP error
        const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
        const assistantMsg: ChatMessage = {
          id: `asst-fallback-${Date.now()}`,
          sender: 'assistant',
          text: fallback.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButtons: fallback.actionButtons,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      // Fallback to client-side grounded engine on network/offline error
      const fallback = generateGroundedAssistantResponse(text, { locale: isHi ? 'hi' : undefined });
      const assistantMsg: ChatMessage = {
        id: `asst-offline-${Date.now()}`,
        sender: 'assistant',
        text: fallback.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: fallback.actionButtons,
      };
      setMessages((prev) => [...prev, assistantMsg]);
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

  // If on a protected student/admin portal, do not render
  if (isProtectedPortal) {
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

      {/* 2. EXPANDABLE CHAT WINDOW */}
      {isOpen && (
        <section
          id="viar-ai-chat-window"
          role="dialog"
          aria-modal="false"
          aria-label={isHi ? 'विहंगम ज्योतिष सहायक' : 'VIAR AI Assistant'}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[85vh] z-50 flex flex-col rounded-3xl bg-[#0B0F19]/95 backdrop-blur-2xl border-2 border-amber-500/30 shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* A. HEADER */}
          <div className="p-4 bg-gradient-to-r from-[#151B2E] via-[#101424] to-[#151B2E] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Bot Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                  <Bot className="w-5 h-5 text-slate-950" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F19]"></span>
              </div>

              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    {isHi ? 'विहंगम ज्योतिष सहायक' : 'VIAR AI Assistant'}
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isHi ? 'आचार्य नीरज कुमार संस्थान • 24/7 सहायता' : 'Acharya Niraj Kumar\'s Academy'}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                aria-label={isHi ? 'सहायक बंद करें' : 'Close assistant'}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* B. LANGUAGE & GROUNDING BANNER */}
          <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300 shrink-0">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isHi ? 'सत्यापित जानकारी: फीस ₹5,100 • 23 मॉड्यूल' : 'Grounded: Tuition ₹5,100 • 23 Modules'}</span>
            </span>
            <span className="font-mono text-slate-400 text-[9px]">EN • हिं • Hinglish</span>
          </div>

          {/* C. CHAT MESSAGES LOG */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm custom-scrollbar"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[88%] ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      msg.sender === 'user'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-amber-400 border border-white/10'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                        : 'bg-[#151B2E] text-slate-200 border border-white/10 rounded-tl-none shadow-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-slate-500 mt-1 px-8">
                  {msg.timestamp}
                </span>

                {/* Contextual Action Buttons */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="mt-2.5 pl-8 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.actionButtons.map((action, idx) => {
                      if (action.type === 'whatsapp') {
                        return (
                          <a
                            key={idx}
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{action.label}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        );
                      }
                      if (action.type === 'call') {
                        return (
                          <a
                            key={idx}
                            href={action.url}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-sky-400" />
                            <span>{action.label}</span>
                          </a>
                        );
                      }
                      if (action.type === 'enroll') {
                        return (
                          <Link
                            key={idx}
                            href={action.url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition shadow-sm shadow-amber-500/10"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                            <span>{action.label}</span>
                          </Link>
                        );
                      }
                      return (
                        <Link
                          key={idx}
                          href={action.url}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-medium transition"
                        >
                          <span>{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-white/10 text-amber-400 border border-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-[#151B2E] border border-white/10 rounded-tl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* D. SUGGESTED PROMPT CHIPS */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-black/40 border-t border-white/5 flex flex-wrap gap-1.5 shrink-0">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-300 text-[11px] transition text-left disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* E. INPUT FORM */}
          <div className="p-3 bg-[#101424] border-t border-white/10 shrink-0">
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
