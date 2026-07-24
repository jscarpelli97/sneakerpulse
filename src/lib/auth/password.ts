import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 120_000;
const KEY_LEN = 32;
const DIGEST = "sha256";

export function randomSaltB64() {
  return randomBytes(16).toString("base64");
}

export function hashPassword(password: string, saltB64: string) {
  const salt = Buffer.from(saltB64, "base64");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return hash.toString("base64");
}

export function verifyPassword(
  password: string,
  saltB64: string,
  expectedHashB64: string,
) {
  const actual = Buffer.from(hashPassword(password, saltB64), "base64");
  const expected = Buffer.from(expectedHashB64, "base64");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
