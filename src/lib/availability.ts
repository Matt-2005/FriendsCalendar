import "server-only";
import { addDaysToKey, dayKey, parisDayEnd, parisDayStart } from "./dates";

export const AVAIL_TYPES = ["AVAILABLE", "BUSY", "VACATION"] as const;
export type AvailType = (typeof AVAIL_TYPES)[number];

export const isAvailType = (t: unknown): t is AvailType => AVAIL_TYPES.includes(t as AvailType);

/** Toutes les clés de jour (heure de Paris) couvertes par une période */
export function keysInRange(start: Date | string, end: Date | string, max = 400) {
  const keys: string[] = [];
  let k = dayKey(start);
  const last = dayKey(end);
  while (k <= last && keys.length < max) {
    keys.push(k);
    k = addDaysToKey(k, 1);
  }
  return keys;
}

export const rangeFromKeys = (startKey: string, endKey: string) => ({
  startDate: parisDayStart(startKey),
  endDate: parisDayEnd(endKey),
});
