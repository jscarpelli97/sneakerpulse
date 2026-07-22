import { describe, expect, it } from "vitest";
import { usernameFromEmail, isValidUsername, isValidEmail } from "@/lib/portfolio/username";

describe("portfolio username helpers", () => {
  it("builds username from email local-part", () => {
    expect(usernameFromEmail("John.Doe+fit@gmail.com")).toBe("john.doefit");
    expect(usernameFromEmail("a@b.co")).toBe("a");
  });

  it("validates username and email", () => {
    expect(isValidUsername("collector_1")).toBe(true);
    expect(isValidUsername("x")).toBe(false);
    expect(isValidEmail("you@example.com")).toBe(true);
    expect(isValidEmail("bad")).toBe(false);
  });
});
