import { describe, expect, it } from "vitest";
import { hashPassword, randomSaltB64, verifyPassword } from "@/lib/auth/password";
import { signAuthSession, verifyAuthSession } from "@/lib/auth/session";

describe("auth password", () => {
  it("hashes and verifies with PBKDF2", () => {
    const salt = randomSaltB64();
    const hash = hashPassword("hunter2!!", salt);
    expect(verifyPassword("hunter2!!", salt, hash)).toBe(true);
    expect(verifyPassword("wrong", salt, hash)).toBe(false);
  });
});

describe("auth session jwt", () => {
  it("round-trips claims", async () => {
    const { token } = await signAuthSession({
      userId: "00000000-0000-4000-8000-000000000001",
      email: "you@spimarkets.com",
      username: "john",
    });
    const session = await verifyAuthSession(token);
    expect(session?.email).toBe("you@spimarkets.com");
    expect(session?.username).toBe("john");
    expect(session?.userId).toBe("00000000-0000-4000-8000-000000000001");
  });
});
