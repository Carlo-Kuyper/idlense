import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { cfCheckLetter, cfDecode, documents } from "../../src/countries/it.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const withCheck = (first15: string) => first15 + cfCheckLetter(first15);
const OMO = "LMNPQRSTUV";
/** Apply `n` omocodia substitutions right-to-left. */
const omocode = (cf15: string, n: number) => {
  const c = [...cf15];
  for (const p of [14, 13, 12, 10, 9, 7, 6].slice(0, n)) c[p] = OMO[Number(c[p])]!;
  return c.join("");
};

describe("IT_CF", () => {
  test("extracts everything", () => {
    expect(v("IT_CF", "RSSMRA85M01H501Q")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1985-08-01",
        birthYear: 1985,
        gender: "male",
        region: "H501",
        extra: { surnameCode: "RSS", nameCode: "MRA", bornAbroad: false, omocodia: false },
      },
    });
    expect(v("IT_CF", withCheck("BNCLRA45A41Z404"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1945-01-01", gender: "female", region: "Z404", extra: { bornAbroad: true } },
    });
  });

  test("omocodia", () => {
    const cf = withCheck(omocode("RSSMRA85M01H501", 3));
    expect(cf.slice(6, 15)).toBe("85M01HRLM");
    expect(v("IT_CF", cf)).toMatchObject({ ok: true, data: { dateOfBirth: "1985-08-01", region: "H501", extra: { omocodia: true } } });
    expect(v("IT_CF", withCheck(omocode("RSSMRA85M01H501", 7)))).toMatchObject({ ok: true, data: { dateOfBirth: "1985-08-01" } });
    // a letter left of a digit was never issued
    expect(cfDecode("RSSMRAU5M01H501Q")).toBeUndefined();
    expect(v("IT_CF", withCheck("RSSMRAU5M01H501"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("dates and checksum", () => {
    expect(v("IT_CF", withCheck("RSSMRA85B30H501"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("IT_CF", withCheck("RSSMRA26T31H501"))).toMatchObject({ ok: true, data: { dateOfBirth: "1926-12-31" } });
    expect(v("IT_CF", withCheck("RSSMRA26S16H501"))).toMatchObject({ ok: true, data: { dateOfBirth: "2026-11-16" } });
    expect(v("IT_CF", "RSSMRA85M01H501A")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IT_CF", "RSSMRA85F01H501Q")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  const gen = (r: () => number) => {
    const base = fromTemplate("AAAAAA##[ABCDEHLMPRST][0-7]#A###", r);
    const body = r() < 0.3 ? omocode(base, Math.floor(r() * 8)) : base;
    const mixed = r() < 0.05 ? body.slice(0, 6) + OMO[Number(body[6])] + body.slice(7) : body;
    return r() < 0.8 ? withCheck(mixed) : mixed + fromTemplate("A", r);
  };
  const ourReason = (s: string) => {
    const r = v("IT_CF", s);
    return r.ok ? undefined : r.reason;
  };

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IT_CF"),
      generate: gen,
      samples: 10000,
      allow: (s, ours) => {
        if (ours) return undefined;
        if (ourReason(s) === "invalid_date") return "impossible or future birth date rejected";
        if (cfDecode(s) === undefined) return "out-of-order omocodia rejected";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IT_CF"),
      generate: gen,
      samples: 10000,
      allow: (s, ours) => {
        if (!ours) {
          if (ourReason(s) === "invalid_date") return "future birth date rejected";
          if (cfDecode(s) === undefined) return "out-of-order omocodia rejected";
          return undefined;
        }
        const r = v("IT_CF", s);
        if (r.ok && r.data.birthYear! < 1950 && Number(cfDecode(s)!.slice(6, 8)) < 50) return "century: latest past, not YY<50 → 20YY";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IT_PIVA", () => {
  test("valid", () => {
    expect(v("IT_PIVA", "IT 12345670017")).toMatchObject({ ok: true, normalized: "12345670017", data: { serial: "1234567", region: "001" } });
    expect(v("IT_PIVA", "12345670018")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IT_PIVA", "00000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("IT_PIVA", "1234567000" + luhnCheckDigit("1234567000"))).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IT_PIVA"),
      generate: (r) => {
        const b = r() < 0.1 ? "0000000" + fromTemplate("###", r) : fromTemplate("#######[01]##", r);
        return b + (r() < 0.6 ? luhnCheckDigit(b) : fromTemplate("#", r));
      },
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("IT_PIVA", s);
        return !r.ok && r.reason === "invalid_range" ? "all-zero taxpayer number or office 000 rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
