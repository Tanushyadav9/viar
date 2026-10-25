'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StudentProfileView from '@/components/admin/StudentProfileView';

export default function AdminStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen cosmic-bg bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <StudentProfileView
          studentId={params.id}
          onBack={() => router.push('/admin?tab=students')}
          onScheduleSession={(st) => {
            router.push(`/admin/sessions?studentId=${st.id}&schedule=true`);
          }}
          onOpenAttendanceModal={(sess) => {
            router.push(`/admin/sessions?sessionId=${sess.id}&attendance=true`);
          }}
        />
      </div>
    </div>
  );
}
