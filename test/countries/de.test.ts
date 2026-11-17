import { describe, expect, test } from "vitest";
import { iso7064HybridCheck } from "../../src/core/algorithms.js";
import { documents, steuerIdRepetitionOk } from "../../src/countries/de.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const withCheck = (body: string) => body + iso7064HybridCheck(body, 10);

/** Mostly well-formed Steuer-ID bodies (one repeated digit), some random, with a correct check digit 80% of the time. */
function genSteuerId(r: () => number): string {
  let body: string;
  if (r() < 0.75) {
    const digits = [..."0123456789"].sort(() => r() - 0.5).slice(0, r() < 0.7 ? 9 : 8);
    while (digits.length < 10) digits.push(digits[Math.floor(r() * digits.length)]!);
    body = digits.sort(() => r() - 0.5).join("");
  } else body = fromTemplate("##########", r);
  return r() < 0.8 ? withCheck(body) : body + fromTemplate("#", r);
}

describe("DE_STEUER_ID", () => {
  test("valid", () => {
    expect(v("DE_STEUER_ID", "86 095 742 719")).toMatchObject({ ok: true, formatted: "86 095 742 719", data: { extra: {} } });
  });

  test("repetition rules", () => {
    expect(steuerIdRepetitionOk("8609574271")).toBe(true); // 7 twice
    expect(steuerIdRepetitionOk("1012345600")).toBe(false); // two different digits repeat
    expect(steuerIdRepetitionOk("1023456789")).toBe(false); // nothing repeats
    expect(steuerIdRepetitionOk("1121345678")).toBe(true); // 1 three times, not consecutive
    expect(steuerIdRepetitionOk("1112345678")).toBe(false); // three in a row
    expect(steuerIdRepetitionOk("1121314567")).toBe(false); // 1 four times
    expect(v("DE_STEUER_ID", withCheck("1023456789"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("DE_STEUER_ID", withCheck("1112345678"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("DE_STEUER_ID", withCheck("0609574271"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("DE_STEUER_ID", "86095742718")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("DE_STEUER_ID", "8609574271")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  const triple = (s: string) => /(\d)\1\1/.test(s.slice(0, 10));
  const counts = (s: string) => {
    const m = new Map<string, number>();
    for (const c of s.slice(0, 10)) m.set(c, (m.get(c) ?? 0) + 1);
    return [...m.values()];
  };

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DE_STEUER_ID"),
      generate: genSteuerId,
      samples: 10000,
      allow: (s, ours) => (!ours && triple(s) ? "three identical digits in a row rejected" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DE_STEUER_ID"),
      generate: genSteuerId,
      samples: 10000,
      allow: (s, ours) => {
        if (ours) return undefined;
        if (s[0] === "0") return "leading zero rejected";
        const c = counts(s);
        if (!c.some((n) => n > 1)) return "body without a repeated digit rejected";
        if (c.some((n) => n > 3)) return "digit repeated more than three times rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("DE_STEUERNUMMER", () => {
  test("shapes", () => {
    expect(v("DE_STEUERNUMMER", "9181081508155")).toMatchObject({ ok: true, data: { region: "9181", extra: { format: "nationwide" } } });
    expect(v("DE_STEUERNUMMER", "181/815/08155")).toMatchObject({ ok: true, data: { extra: { format: "land" } } });
    expect(v("DE_STEUERNUMMER", "21/815/08150")).toMatchObject({ ok: true });
    expect(v("DE_STEUERNUMMER", "9181181508155")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("DE_STEUERNUMMER", "123456789012")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DE_STEUERNUMMER"),
      generate: (r) => fromTemplate("#".repeat(9 + Math.floor(r() * 5)), r),
      allow: (s, ours) => {
        if (ours) return undefined;
        if (s.length === 12) return "12-digit numbers rejected";
        if (s.length === 13 && s[4] !== "0") return "nationwide form needs 0 in position 5";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("DE_USTID", () => {
  test("valid", () => {
    expect(v("DE_USTID", "DE 136 695 976")).toMatchObject({ ok: true, formatted: "DE 136 695 976" });
    expect(v("DE_USTID", "136695976")).toMatchObject({ ok: true, normalized: "DE136695976" });
    expect(v("DE_USTID", "DE136695977")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("DE_USTID", "DE036695976")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "DE_USTID"),
      generate: (r) => {
        const body = fromTemplate("########", r);
        return "DE" + body + (r() < 0.7 ? iso7064HybridCheck(body, 10) : fromTemplate("#", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
