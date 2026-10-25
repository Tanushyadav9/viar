'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import type { OneOnOneSessionRecord } from '@/lib/sessions/types';

export default function StudentPersonalSessions() {
  const [sessions, setSessions] = useState<OneOnOneSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const upcomingSessions = sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE');
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-xs text-center">
        Loading your personal 1-on-1 live classes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl cosmic-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1-on-1 Mentorship
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-hindi">व्यक्तिगत लाइव कक्षाएं</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Personal Live Classes with Acharya Niraj Kumar
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              In addition to the 23 recorded modules, Acharya ji conducts private live classes tailored to your chart, pace, and queries.
            </p>
          </div>

          <a
            href="https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20would%20like%20to%20schedule%20my%20next%201-on-1%20personal%20astrology%20class."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 shadow-lg shadow-emerald-900/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Request Time on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 2. Upcoming Classes */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Upcoming 1-on-1 Classes (आगामी व्यक्तिगत कक्षाएं)</span>
        </h3>

        {upcomingSessions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400 space-y-2">
            <p>No upcoming 1-on-1 classes scheduled at this moment.</p>
            <p className="text-[11px] text-slate-500">
              Acharya Niraj Kumar sets up individual classes on a date and time suited to you. Message Acharya ji on WhatsApp to confirm your slot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcomingSessions.map((s) => {
              const d = new Date(s.scheduledAt);
              const formattedDate = d.toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
                hour12: true,
              });

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl cosmic-card border-2 border-amber-500/40 bg-slate-900/90 shadow-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Confirmed Slot
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{formattedDate} (IST)</span>
                        </span>
                        <span className="text-xs text-slate-400">({s.durationMinutes} mins)</span>
                      </div>
                      <h4 className="text-base font-bold text-white">{s.title}</h4>
                    </div>

                    {s.meetingLink && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shrink-0"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Live Class</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {s.notes && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200">
                      <strong className="text-amber-300 block mb-0.5">Notes from Acharya ji:</strong>
                      <p>{s.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Completed Classes & Record of What Was Taught */}
      {completedSessions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Class Log & Record of What Was Taught (कक्षा सारांश एवं रिकॉर्ड)</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {completedSessions.map((s) => {
              const d = new Date(s.scheduledAt);
              const formattedDate = d.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Kolkata',
              });

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl cosmic-card border border-emerald-500/30 bg-slate-900/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-semibold block">
                        Conducted on {formattedDate}
                      </span>
                      <h4 className="text-base font-bold text-white">{s.title}</h4>
                    </div>
                    {s.recordingUrl && (
                      <a
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 text-xs font-semibold hover:underline flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>View Recording</span>
                      </a>
                    )}
                  </div>

                  {s.taughtRecord && (
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                      <span className="font-bold text-emerald-300 block">Topics Taught in This Class:</span>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{s.taughtRecord}</p>

                      {s.homework && (
                        <div className="pt-2 border-t border-white/5">
                          <span className="font-bold text-amber-300 block">Homework & Exercises Assigned:</span>
                          <p className="text-slate-300 leading-relaxed">{s.homework}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
