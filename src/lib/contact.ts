export {
  CONTACT_TOPICS,
  isContactTopic,
  isValidContactEmail,
  type ContactTopicId,
} from "@/lib/contactTopics";

/** Server-only inbox for contact form delivery (never shown in the UI). */
export function contactInboxEmail() {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.PLUS_INTEREST_EMAIL?.trim() ||
    ""
  );
}
