/**
 * Utilities for grouping chat messages by date and sender.
 */

import type { Message } from "@/lib/api/messages";

/**
 * Determine whether a new day boundary should be drawn before the given message.
 *
 * @param current - Current message.
 * @param previous - Previous message in the list, or undefined.
 * @returns True when the day changed.
 */
export function isNewDay(current: Message, previous?: Message): boolean {
  if (!previous) return true;
  const currentDate = new Date(current.created_at).toDateString();
  const previousDate = new Date(previous.created_at).toDateString();
  return currentDate !== previousDate;
}

/**
 * Determine whether the next message continues the same sender group.
 *
 * A new group starts when the sender changes or enough time passes.
 *
 * @param current - Current message.
 * @param next - Next message in the list, or undefined.
 * @param thresholdMinutes - Maximum gap in minutes to keep grouping.
 * @returns True when the current message is the last of its group.
 */
export function isLastInGroup(
  current: Message,
  next?: Message,
  thresholdMinutes = 5,
): boolean {
  if (!next) return true;
  if (next.sender.id !== current.sender.id) return true;
  const diff =
    new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
  return diff > thresholdMinutes * 60 * 1000;
}

/**
 * Format a message timestamp as a chat date divider label.
 *
 * @param isoDate - ISO 8601 timestamp.
 * @returns A localized date label such as "Today" or "Yesterday".
 */
export function formatChatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
