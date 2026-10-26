export function validateLessonPublishReadiness(lesson: {
  type?: string | null;
  videoProviderId?: string | null;
  externalVideoUrl?: string | null;
  documentKey?: string | null;
  documentUrl?: string | null;
  notesMarkdown?: string | null;
  liveScheduledAt?: Date | string | null;
}): { canPublish: boolean; draftReason?: string } {
  const lType = (lesson.type || 'VIDEO').toUpperCase();
  if (lType === 'VIDEO') {
    const vid = lesson.videoProviderId || lesson.externalVideoUrl;
    if (!vid || typeof vid !== 'string' || !vid.trim() || vid.includes('dQw4w9WgXcQ')) {
      return {
        canPublish: false,
        draftReason: 'A video lesson needs a video before it can be published.',
      };
    }
  } else if (lType === 'DOCUMENT') {
    const hasDoc = Boolean(
      (lesson.documentKey && lesson.documentKey.trim()) ||
      (lesson.documentUrl && lesson.documentUrl.trim()) ||
      (lesson.notesMarkdown && lesson.notesMarkdown.trim())
    );
    if (!hasDoc) {
      return {
        canPublish: false,
        draftReason: 'A notes lesson needs a notes or PDF file before it can be published.',
      };
    }
  } else if (lType === 'LIVE_SESSION') {
    const hasDate = Boolean(
      lesson.liveScheduledAt &&
      !isNaN(new Date(lesson.liveScheduledAt).getTime()) &&
      new Date(lesson.liveScheduledAt).getTime() > 86400000
    );
    if (!hasDate) {
      return {
        canPublish: false,
        draftReason: 'A live session lesson needs a scheduled date before it can be published.',
      };
    }
  }
  return { canPublish: true };
}
