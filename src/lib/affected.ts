import type { AffectedCounts, AffectedGroup } from "@/lib/types";

export const AFFECTED_GROUPS: AffectedGroup[] = ["adults", "children", "elderly", "disabled", "pregnant", "trapped"];

/** Groups that are only shared with responders when the resident consents. */
export const SENSITIVE_GROUPS: AffectedGroup[] = ["children", "elderly", "disabled", "pregnant"];

/** Groups that need extra support during a rescue. */
export const VULNERABLE_GROUPS: AffectedGroup[] = ["children", "elderly", "disabled", "pregnant"];

export const NO_AFFECTED: AffectedCounts = {
  adults: 0,
  children: 0,
  elderly: 0,
  disabled: 0,
  pregnant: 0,
  trapped: 0,
};

export const affected = (counts: Partial<AffectedCounts>): AffectedCounts => ({ ...NO_AFFECTED, ...counts });

/** Everyone affected. "Trapped" people are counted on their own, not inside the other groups. */
export function totalAffected(a: AffectedCounts): number {
  return AFFECTED_GROUPS.reduce((sum, g) => sum + a[g], 0);
}

export function vulnerableCount(a: AffectedCounts): number {
  return VULNERABLE_GROUPS.reduce((sum, g) => sum + a[g], 0);
}

/** What leaves the device: sensitive groups are folded into adults without consent. */
export function shareableAffected(a: AffectedCounts, consent: boolean): AffectedCounts {
  if (consent) return a;
  const hidden = SENSITIVE_GROUPS.reduce((sum, g) => sum + a[g], 0);
  return { ...a, children: 0, elderly: 0, disabled: 0, pregnant: 0, adults: a.adults + hidden };
}
