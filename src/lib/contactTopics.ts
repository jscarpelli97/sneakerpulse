import { isValidEmail } from "@/lib/email";

export const isValidContactEmail = isValidEmail;

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
