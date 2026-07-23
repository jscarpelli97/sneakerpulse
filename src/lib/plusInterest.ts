import { isValidEmail } from "@/lib/email";

export { isValidEmail as isValidInterestEmail };

/** Server-only delivery inbox for Plus interest. Never render in UI. */
export function plusInterestEmail() {
  return process.env.PLUS_INTEREST_EMAIL?.trim() || "";
}
