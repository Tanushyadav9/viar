'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Send,
  Phone
} from 'lucide-react';

import { SISTER_SERVICES } from '@/config/services';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Course Admissions Inquiry');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Student Support & Inquiries</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Get in Touch with Viar Academy
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Have questions about upcoming cohort schedules, timezone adjustments, or payment methods? Our academic admissions team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
          
          {/* Left: Contact Info & Sister Platforms */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Academic & Admissions Office</h3>
              
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Admissions & Support</span>
                  <a href="mailto:admissions@viar.in" className="text-amber-300 hover:underline">
                    admissions@viar.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">WhatsApp Student Desk</span>
                  <a href="https://wa.me/919311215564" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                    +91 93112 15564
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Academic Coordination</span>
                  <span>New Delhi, India • Serving students worldwide</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Response Hours</span>
                  <span>Monday – Saturday: 10:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            </div>

            {/* Note on Private Consultations */}
            <div className="cosmic-card p-6 rounded-2xl border border-amber-500/30 bg-[#0e1320] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/aapkaastro-logo.png"
                    alt="Aapka Astro"
                    width={90}
                    height={24}
                    className="h-6 w-auto object-contain brightness-110"
                  />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">{SISTER_SERVICES.aapkaAstro.badge}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{SISTER_SERVICES.aapkaAstro.tagline}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {SISTER_SERVICES.aapkaAstro.description}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button flex-1 py-2.5 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                >
                  <span>{SISTER_SERVICES.aapkaAstro.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-center bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition inline-flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Corporate Advisory Note */}
            <div className="cosmic-card p-6 rounded-2xl border border-sky-500/20 bg-[#0d1424] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">{SISTER_SERVICES.dowConsulting.badge}</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {SISTER_SERVICES.dowConsulting.description}
              </p>
              <a
                href={SISTER_SERVICES.dowConsulting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-300 hover:text-white underline font-semibold inline-flex items-center gap-1"
              >
                <span>{SISTER_SERVICES.dowConsulting.domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Inquiry Received</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{name}</strong>. Our admissions coordinator will review your request and reply to <strong className="text-amber-300">{email}</strong> within 24 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-white mb-2">Send an Academic Inquiry</h2>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Topic of Inquiry
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    >
                      <option value="Course Admissions Inquiry">Course Admissions Inquiry</option>
                      <option value="Timezone & Schedule Assistance">Timezone & Schedule Assistance</option>
                      <option value="Payment / Currency Question">Payment / Currency Question</option>
                      <option value="Certificate Verification Assistance">Certificate Verification Assistance</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please let us know your query or country timezone..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="gold-button w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Submit Academic Inquiry</span>
                    <Send className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Your contact details are encrypted and kept strictly confidential.</span>
                  </p>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
