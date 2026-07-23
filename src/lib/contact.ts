import { plusInterestEmail } from "@/lib/plusInterest";

/** Server-only inbox for contact form delivery (never shown in the UI). */
export function contactInboxEmail() {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.PLUS_INTEREST_EMAIL?.trim() ||
    plusInterestEmail()
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidContactEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 160) return false;
  return EMAIL_RE.test(email);
}

export const CONTACT_TOPICS = [
  { id: "feedback", label: "General feedback" },
  { id: "shoe", label: "Shoe to add" },
  { id: "thoughts", label: "Thoughts / ideas" },
  { id: "other", label: "Something else" },
] as const;

export type ContactTopicId = (typeof CONTACT_TOPICS)[number]["id"];

export function isContactTopic(value: string): value is ContactTopicId {
  return CONTACT_TOPICS.some((topic) => topic.id === value);
}
