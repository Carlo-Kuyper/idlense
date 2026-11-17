import { describe, expect, test } from "vitest";
import { jmbgCheck } from "../../src/countries/rs.js";
import { documents, siTaxCheckDigit } from "../../src/countries/si.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const EMSO = spec(documents, "SI_EMSO");
const VAT = spec(documents, "SI_VAT");
const withCheck = (first12: string) => first12 + jmbgCheck(first12).k;
describeContract(documents);

describe("SI_EMSO", () => {
  test("extracts everything", () => {
    expect(check(EMSO, "0101990500003")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1990-01-01",
        birthYear: 1990,
        gender: "male",
        region: "50",
        regionName: "Slovenia",
        serial: "000",
        extra: { registerArea: "Slovenia" },
      },
    });
    // Worked example in the decree's annex: 29.2.1932, female, serial 552, check 6
    expect(check(EMSO, "2902932505526")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1932-02-29", gender: "female", serial: "552" },
    });
  });

  test("other republics, new register codes, foreigners", () => {
    expect(check(EMSO, withCheck("010197033124"))).toMatchObject({ ok: true, data: { regionName: "Zagreb" } });
    expect(check(EMSO, withCheck("010202551123"))).toMatchObject({ ok: true, data: { region: "51" } });
    expect(check(EMSO, withCheck("010198505123"))).toMatchObject({ ok: true, data: { citizenship: "foreigner" } });
  });

  test("remainder 1 is never issued", () => {
    let body = "";
    for (let s = 0; s < 1000 && !body; s++) {
      const b = "010199050" + String(s).padStart(3, "0");
      if (jmbgCheck(b).remainderOne) body = b;
    }
    expect(body).not.toBe("");
    expect(check(EMSO, body + "0")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("rejections", () => {
    expect(check(EMSO, withCheck("010199040000"))).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(EMSO, withCheck("290200150000"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(check(EMSO, "0101990500004")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(EMSO, "0100990500003")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(EMSO, "010199050000")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: EMSO,
      generate: (r) => fromTemplate("[0-2]#[01]#[089]##5#####", r),
      samples: 20000,
      allow: (s, ours) => {
        const r = check(EMSO, s, REF);
        if (!ours && !r.ok && r.reason === "invalid_date") return "future birth date rejected";
        if (!ours && !r.ok && r.reason === "invalid_checksum" && jmbgCheck(s).remainderOne) return "remainder 1 never issued";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("idnumbers rejects pre-1991 numbers from other republics", () => {
    const res = compareWithOracle({
      spec: EMSO,
      generate: (r) => fromTemplate("[0-2]#[01]#9##[0-9]#####", r),
      samples: 5000,
      allow: (s, ours) => {
        const rr = Number(s.slice(7, 9));
        const r = check(EMSO, s, REF);
        if (ours && (rr < 50 || rr > 59)) return "register code from another republic accepted";
        if (!ours && !r.ok && r.reason === "invalid_checksum" && jmbgCheck(s).remainderOne) return "remainder 1 never issued";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

const vatRemainder = (s: string) => [8, 7, 6, 5, 4, 3, 2].reduce((a, w, i) => a + w * Number(s[i]), 0) % 11;

describe("SI_VAT", () => {
  test("real VAT IDs from the EU VIES test set, with and without prefix", () => {
    // remainders 3, 1 (K 0), 10 (K 1), 7, 9
    for (const s of ["SI 26808498", "SI48673820", "SI-83815201", "50223054", "si 3609 7152"]) {
      expect(check(VAT, s), s).toMatchObject({ ok: true, data: {} });
    }
    expect(vatRemainder("48673820")).toBe(1);
    expect(vatRemainder("83815201")).toBe(10);
    expect(check(VAT, "SI 26808498")).toMatchObject({ normalized: "26808498" });
  });

  test("rejections", () => {
    expect(check(VAT, "26808497")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(VAT, "02345678")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(VAT, "2680849")).toMatchObject({ ok: false, reason: "invalid_length" });
    // remainder 0 would need check digit 11: no valid number
    let body = "";
    for (let s = 1000000; s < 1001000 && !body; s++) if (siTaxCheckDigit(String(s)) === undefined) body = String(s);
    expect(body).not.toBe("");
    for (const d of "0123456789") expect(check(VAT, body + d).ok).toBe(false);
  });

  test("agrees with nationid except documented fixes", () => {
    const res = compareWithOracle({
      spec: VAT,
      generate: (r) => fromTemplate("[1-9]#######", r),
      samples: 20000,
      allow: (s, ours) => {
        const rem = vatRemainder(s);
        if (ours && rem === 1) return "remainder 1 → check digit 0 accepted";
        if (ours && rem === 10) return "remainder 10 → check digit 1 accepted";
        if (!ours && rem === 10 && s[7] === "0") return "remainder 10 with check digit 0 rejected";
        if (!ours && rem === 0) return "remainder 0 never issued";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
