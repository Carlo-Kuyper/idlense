import { compact } from "./normalize.js";
import type { DocumentSpec, ParseOutcome } from "./types.js";

/** Run one document's rules on raw input. Never throws. */
export function runDocument(
  spec: DocumentSpec,
  input: string,
  referenceDate: Date,
): { normalized: string; outcome: ParseOutcome } {
  let normalized = "";
  try {
    if (typeof input !== "string") return { normalized, outcome: { ok: false, reason: "empty" } };
    normalized = spec.normalize ? spec.normalize(input) : compact(input);
    if (normalized === "") return { normalized, outcome: { ok: false, reason: "empty" } };
    if (!spec.lengths.includes(normalized.length)) return { normalized, outcome: { ok: false, reason: "invalid_length" } };
    if (!spec.pattern.test(normalized)) return { normalized, outcome: { ok: false, reason: "invalid_format" } };
    return { normalized, outcome: spec.parse(normalized, { referenceDate }) };
  } catch {
    return { normalized, outcome: { ok: false, reason: "invalid" } };
  }
}
