import { describe, expect, test } from "vitest";
import { documents, thaiCheckDigit, TH_PROVINCES } from "../../src/countries/th.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const TH = spec(documents, "TH_PIN");
const validateDocument = (s: string) => check(TH, s, REF);
describeContract(documents);

const withCheck = (first12: string) => first12 + thaiCheckDigit(first12);

describe("TH_PIN", () => {
  test("extracts category and registration office", () => {
    expect(validateDocument("1-1017-00000-00-1")).toMatchObject({
      ok: true,
      normalized: "1101700000001",
      formatted: "1-1017-00000-00-1",
      data: {
        citizenship: "citizen",
        region: "10",
        regionName: "Bangkok",
        serial: "0000000",
        extra: { category: 1, categoryDescription: "thai_born_from_1984", registrationOffice: "1017" },
      },
    });
  });

  test("categories", () => {
    expect(validateDocument(withCheck("650100012345"))).toMatchObject({ ok: true, data: { citizenship: "foreigner", regionName: "Chiang Mai" } });
    const r3 = validateDocument(withCheck("310100012345"));
    expect(r3).toMatchObject({ ok: true, data: { extra: { category: 3 } } });
    expect(r3.ok && r3.data.citizenship).toBeUndefined();
    // category 0: no office code, any digits 2-5
    const r0 = validateDocument(withCheck("000000000000"));
    expect(r0).toMatchObject({ ok: true, data: { citizenship: "stateless", extra: { category: 0 } } });
    expect(r0.ok && r0.data.region).toBeUndefined();
    expect(validateDocument(withCheck("900000000000"))).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("municipal district codes count down from 99 (Pattaya 2096)", () => {
    expect(validateDocument(withCheck("320960012345"))).toMatchObject({ ok: true, data: { regionName: "Chon Buri", extra: { registrationOffice: "2096" } } });
  });

  test("rejections", () => {
    expect(validateDocument("1101700000002")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(validateDocument(withCheck("128000000000"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(validateDocument("110170000000")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(Object.keys(TH_PROVINCES)).toHaveLength(77);
  });

  test("agrees with idnumbers except documented fixes", () => {
    const provinces = Object.keys(TH_PROVINCES);
    const res = compareWithOracle({
      spec: TH,
      generate: (r) => {
        const p = r() < 0.9 ? provinces[Math.floor(r() * provinces.length)]! : fromTemplate("##", r);
        const s = fromTemplate("#", r) + p + fromTemplate("[0-9]#########", r).slice(0, 9);
        return r() < 0.5 ? withCheck(s) : s + fromTemplate("#", r);
      },
      samples: 10000,
      allow: (s, ours, theirs) => {
        if (!ours || theirs) return undefined;
        if (s[0] === "0") return "category 0 has no province office code";
        if (TH_PROVINCES[s.slice(1, 3)]) return "district not capped per province (municipal codes)";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
