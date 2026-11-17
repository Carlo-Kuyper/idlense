import { describe, expect, test } from "vitest";
import { documents } from "../../src/countries/us.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const validateDocument = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

/** Our only deliberate SSN divergence: the two SSA-voided numbers. */
const voidedFix = (s: string, ours: boolean) => {
  if (ours) return undefined;
  const r = validateDocument("US_SSN", s);
  return !r.ok && r.reason === "invalid_range" && ["078051120", "219099999"].includes(r.normalized)
    ? "SSA-voided SSN rejected"
    : undefined;
};

describe("US_SSN", () => {
  test("valid", () => {
    expect(validateDocument("US_SSN", "123-45-6789")).toMatchObject({
      ok: true,
      formatted: "123-45-6789",
      data: { serial: "6789", extra: { area: "123", group: "45" } },
    });
    expect(validateDocument("US_SSN", "123 45 6789").ok).toBe(true);
  });

  test("reserved ranges", () => {
    for (const s of ["000-12-3456", "666-12-3456", "900-12-3456", "999-12-3456", "123-00-4567", "123-45-0000", "078-05-1120", "219-09-9999"]) {
      expect(validateDocument("US_SSN", s), s).toMatchObject({ ok: false, reason: "invalid_range" });
    }
    expect(validateDocument("US_SSN", "12345678")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  // Biased toward the reserved ranges so they are exercised; dashed because idnumbers requires it.
  const gen = (r: () => number) => {
    const s = fromTemplate("#########", r);
    const k = r();
    let b = s;
    if (k < 0.05) b = "000" + s.slice(3);
    else if (k < 0.1) b = "666" + s.slice(3);
    else if (k < 0.15) b = s.slice(0, 3) + "00" + s.slice(5);
    else if (k < 0.2) b = s.slice(0, 5) + "0000";
    return `${b.slice(0, 3)}-${b.slice(3, 5)}-${b.slice(5)}`;
  };

  test("agrees with idnumbers", () => {
    const res = compareWithOracle({
      spec: spec(documents, "US_SSN"),
      generate: gen,
      allow: voidedFix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "US_SSN"),
      generate: gen,
      allow: voidedFix,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("voided SSNs: upstream accepts, we reject", () => {
    expect(validateDocument("US_SSN", "078-05-1120").ok).toBe(false);
  });
});

describe("US_ITIN / US_ATIN", () => {
  test("ITIN group ranges", () => {
    expect(validateDocument("US_ITIN", "912-70-1234")).toMatchObject({ ok: true, formatted: "912-70-1234", data: { serial: "1234" } });
    for (const g of ["50", "65", "70", "88", "90", "92", "94", "99"]) expect(validateDocument("US_ITIN", `912${g}1234`).ok, g).toBe(true);
    for (const g of ["49", "66", "69", "89", "93", "00"]) {
      expect(validateDocument("US_ITIN", `912${g}1234`), g).toMatchObject({ ok: false, reason: "invalid_range" });
    }
    expect(validateDocument("US_ITIN", "812701234")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("ITIN groups 70-88 are flagged expired", () => {
    for (const g of ["70", "79", "80", "88"]) {
      expect(validateDocument("US_ITIN", `912${g}1234`), g).toMatchObject({ ok: true, data: { extra: { group: g, expired: true } } });
    }
    for (const g of ["50", "65", "90", "99"]) {
      const r = validateDocument("US_ITIN", `912${g}1234`);
      expect(r.ok && r.data.extra.expired, g).toBeUndefined();
    }
  });

  test("ATIN is group 93", () => {
    expect(validateDocument("US_ATIN", "912-93-1234")).toMatchObject({ ok: true, data: { serial: "1234" } });
    expect(validateDocument("US_ATIN", "912-94-1234")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("ITIN agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "US_ITIN"),
      generate: (r) => fromTemplate("[89]########", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("US_EIN", () => {
  test("prefixes", () => {
    expect(validateDocument("US_EIN", "12-3456789")).toMatchObject({ ok: true, formatted: "12-3456789", data: { extra: { prefix: "12" } } });
    for (const p of ["01", "06", "10", "16", "20", "27", "30", "48", "50", "68", "71", "77", "80", "88", "90", "95", "98", "99"]) {
      expect(validateDocument("US_EIN", `${p}1234567`).ok, p).toBe(true);
    }
    for (const p of ["00", "07", "09", "17", "19", "28", "29", "49", "69", "70", "78", "79", "89", "96", "97"]) {
      expect(validateDocument("US_EIN", `${p}1234567`), p).toMatchObject({ ok: false, reason: "invalid_range" });
    }
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "US_EIN"),
      generate: (r) => fromTemplate("##-#######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("US_PASAPORTE", () => {
  test("forms", () => {
    expect(validateDocument("US_PASAPORTE", "a12345678")).toMatchObject({
      ok: true,
      normalized: "A12345678",
      data: { extra: { kind: "next-generation" } },
    });
    expect(validateDocument("US_PASAPORTE", "123456789")).toMatchObject({ ok: true, data: { extra: { kind: "legacy" } } });
    expect(validateDocument("US_PASAPORTE", "AB1234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "US_PASAPORTE"),
      generate: (r) => fromTemplate("[A-Z0-9]X#######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
