import { describe, expect, it } from "vitest";
import { isValidInterestEmail } from "@/lib/plusInterest";

describe("plusInterest", () => {
  it("accepts normal emails", () => {
    expect(isValidInterestEmail("you@example.com")).toBe(true);
    expect(isValidInterestEmail("  A.B+c@Mail.co.uk ")).toBe(true);
  });

  it("rejects junk", () => {
    expect(isValidInterestEmail("")).toBe(false);
    expect(isValidInterestEmail("not-an-email")).toBe(false);
    expect(isValidInterestEmail("@x.com")).toBe(false);
  });
});
