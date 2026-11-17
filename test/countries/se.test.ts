import { describe, expect, test } from "vitest";
import { luhnCheckDigit } from "../../src/core/algorithms.js";
import { documents } from "../../src/countries/se.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string, ref = REF) => check(spec(documents, code), s, ref);
describeContract(documents);

/** 9 digits → 10-digit personnummer with Luhn check. */
const pnr = (nine: string) => nine + luhnCheckDigit(nine);

describe("SE_PERSONNUMMER", () => {
  test("extracts everything", () => {
    expect(v("SE_PERSONNUMMER", "811228-9874")).toMatchObject({
      ok: true,
      normalized: "8112289874",
      formatted: "811228-9874",
      data: { dateOfBirth: "1981-12-28", birthYear: 1981, gender: "male", serial: "987" },
    });
    expect(v("SE_PERSONNUMMER", pnr("811228982"))).toMatchObject({ ok: true, data: { gender: "female" } });
  });

  test("century from separator and 12-digit form", () => {
    const n = pnr("120315123");
    expect(v("SE_PERSONNUMMER", n)).toMatchObject({ ok: true, data: { dateOfBirth: "2012-03-15" } });
    expect(v("SE_PERSONNUMMER", `${n.slice(0, 6)}+${n.slice(6)}`)).toMatchObject({
      ok: true,
      formatted: `${n.slice(0, 6)}+${n.slice(6)}`,
      data: { dateOfBirth: "1912-03-15" },
    });
    expect(v("SE_PERSONNUMMER", "19" + n)).toMatchObject({ ok: true, formatted: `1912031${n.slice(5, 6)}-${n.slice(6)}` });
    expect(v("SE_PERSONNUMMER", "20" + n)).toMatchObject({ ok: true, data: { dateOfBirth: "2012-03-15" } });
    expect(v("SE_PERSONNUMMER", "19811228-9874")).toMatchObject({ ok: true, normalized: "198112289874" });
    // No separator means under 100: idnumbers reads it as 1881.
    expect(v("SE_PERSONNUMMER", "8112289874")).toMatchObject({ data: { dateOfBirth: "1981-12-28" } });
    // On 2026-11-16 someone born 1926-11-17 is still 99, so `+` means 1826.
    const young = pnr("261117123");
    expect(v("SE_PERSONNUMMER", `${young.slice(0, 6)}+${young.slice(6)}`)).toMatchObject({ data: { dateOfBirth: "1826-11-17" } });
    expect(v("SE_PERSONNUMMER", young)).toMatchObject({ data: { dateOfBirth: "1926-11-17" } });
  });

  test("rejections", () => {
    expect(v("SE_PERSONNUMMER", "811228-9875")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("SE_PERSONNUMMER", pnr("810230123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("SE_PERSONNUMMER", "20" + pnr("301228123"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("SE_PERSONNUMMER", "23" + pnr("811228123"))).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SE_PERSONNUMMER", "811328-9874")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SE_PERSONNUMMER", "811228-987")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});

describe("SE_SAMORDNINGSNUMMER", () => {
  test("Skatteverket's example 701063-2391", () => {
    expect(v("SE_SAMORDNINGSNUMMER", "701063-2391")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1970-10-03", gender: "male", extra: { kind: "samordningsnummer" } },
    });
    expect(v("SE_PERSONNUMMER", "701063-2391")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("SE_ORGNR and SE_VAT", () => {
  test("Bolagsverket 202100-5489", () => {
    expect(v("SE_ORGNR", "202100-5489")).toMatchObject({ ok: true, data: { extra: { legalFormGroup: "public_body" } } });
    expect(v("SE_ORGNR", "556036-0793")).toMatchObject({ ok: true, data: { extra: { legalFormGroup: "limited_company" } } });
    expect(v("SE_ORGNR", "556036-0794")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("SE_ORGNR", "8112289874")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("VAT for companies and sole traders", () => {
    expect(v("SE_VAT", "SE 5560360793 01")).toMatchObject({ ok: true, data: { extra: { holderType: "organisation" } } });
    expect(v("SE_VAT", "SE811228987401")).toMatchObject({ ok: true, data: { extra: { holderType: "sole_trader" } } });
    expect(v("SE_VAT", "SE811328987401")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SE_VAT", "SE556036079302")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("SE_VAT", "SE556036079401")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
});

describe("upstream comparison", () => {
  /** Only excuse the date fixes; a checksum disagreement is never allowed. */
  const dateFix = (code: string) => (s: string, ours: boolean) => {
    if (ours) return undefined;
    const r = v(code, s);
    return !r.ok && r.reason === "invalid_date" ? "impossible or future birth date rejected" : undefined;
  };
  const gen10 = (r: () => number) => fromTemplate("##[01]#[0-3]#####", r);

  test("idnumbers, 10-digit with '-' separator", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SE_PERSONNUMMER"),
      generate: (r) => {
        const s = gen10(r);
        return `${s.slice(0, 6)}-${s.slice(6)}`;
      },
      samples: 20000,
      allow: (s, ours, theirs) => {
        return dateFix("SE_PERSONNUMMER")(s, ours);
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid SE_PERSONNUMMER (10 and 12 digits)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SE_PERSONNUMMER"),
      generate: (r) => (r() < 0.5 ? gen10(r) : fromTemplate("[12][089]##[01]#[0-3]#####", r)),
      samples: 20000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v("SE_PERSONNUMMER", s);
        if (!r.ok && r.reason === "invalid_format" && s.length === 12 && !/^(18|19|20)/.test(s))
          return "12-digit form outside 1800-2099";
        return dateFix("SE_PERSONNUMMER")(s, ours);
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid SE_PERSONNUMMER for samordningsnummer", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SE_SAMORDNINGSNUMMER"),
      generate: (r) => fromTemplate("##[01]#[6-9]#####", r),
      samples: 20000,
      allow: dateFix("SE_SAMORDNINGSNUMMER"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid SE_ORGNR", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SE_ORGNR"),
      generate: (r) => fromTemplate("##########", r),
      samples: 5000,
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("nationid SE_VAT", () => {
    const res = compareWithOracle({
      spec: spec(documents, "SE_VAT"),
      generate: (r) => fromTemplate("SE##########0[12]", r),
      samples: 5000,
      allow: (s, ours) => (ours && Number(s[4]) < 2 ? "sole trader VAT (personnummer + 01) accepted" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
