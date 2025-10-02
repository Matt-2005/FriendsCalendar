// lib/token.ts
import { randomBytes } from "crypto";
export function genCalendarToken() {
  return randomBytes(24).toString("base64url"); // URL-safe
}
