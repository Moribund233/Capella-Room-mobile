/**
 * Format an ISO timestamp into a short, locale-aware string.
 *
 * - Within the same day: returns the time (e.g., "10:42").
 * - Yesterday: returns a localized "Yesterday" label.
 * - Otherwise: returns a short date (e.g., "07/18").
 *
 * @param isoDate - ISO 8601 timestamp.
 * @returns A formatted date/time string.
 */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { month: "2-digit", day: "2-digit" });
}
