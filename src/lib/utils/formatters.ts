/**
 * Presentation Formatters for Admin & Portal Views
 * Standardizes raw enum strings into clean, human-readable labels:
 * "Coming soon", "Published", "Draft", "Waiting for payment check", etc.
 */

export function formatCourseStatus(status?: string | null): string {
  if (!status) return 'Draft';
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'Published';
    case 'COMING_SOON':
      return 'Coming soon';
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

export function formatOrderStatus(status?: string | null): string {
  if (!status) return 'Waiting for payment';
  switch (status.toUpperCase()) {
    case 'PAYMENT_CLAIMED':
      return 'Waiting for payment check';
    case 'PENDING_PAYMENT':
      return 'Waiting for payment';
    case 'APPROVED':
    case 'VERIFIED':
    case 'PAID':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'REFUNDED':
      return 'Refunded';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
