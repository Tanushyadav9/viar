/**
 * Presentation Formatters for Admin & Portal Views
 * Standardizes raw enum strings (e.g. COMING_SOON, PUBLISHED) into clean, human-readable labels.
 */

export function formatCourseStatus(status?: string | null): string {
  if (!status) return 'Draft';
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'Published';
    case 'COMING_SOON':
      return 'Coming Soon';
    case 'DRAFT':
      return 'Draft';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatClassStatus(status?: string | null): string {
  if (!status) return 'Upcoming';
  switch (status.toUpperCase()) {
    case 'LIVE':
      return 'Live Now';
    case 'COMPLETED':
      return 'Completed';
    case 'UPCOMING':
      return 'Upcoming';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
