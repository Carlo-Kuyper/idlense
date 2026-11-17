import { describe, expect, test } from "vitest";
import {
  cnhCheckDigits,
  cnpjCheckDigits,
  cpfCheckDigits,
  documents,
  pisCheckDigit,
  rgSpCheck,
  tituloCheckDigits,
} from "../../src/countries/br.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

/** Half the time append the correct check digits, otherwise random ones; sometimes a repeated-digit placeholder. */
const withChecks = (r: () => number, body: string, checks: (b: string) => string, n: number) => {
  if (r() < 0.05) return String(Math.floor(r() * 10)).repeat(body.length + n);
  return r() < 0.5 ? body + checks(body) : body + fromTemplate("#".repeat(n), r);
};

/** Our only deliberate stricter rule: all-same placeholders. */
const placeholder = (code: string) => (s: string, ours: boolean) => {
  if (ours) return undefined;
  const r = v(code, s);
  return !r.ok && r.reason === "invalid_range" ? "repeated-digit placeholder rejected" : undefined;
};

describe("BR_CPF", () => {
  test("extracts the fiscal region", () => {
    expect(v("BR_CPF", "529.982.247-25")).toMatchObject({
      ok: true,
      formatted: "529.982.247-25",
      data: { region: "7", regionName: "ES, RJ", serial: "52998224" },
    });
    const sp = "12345678" + "8";
    expect(v("BR_CPF", sp + cpfCheckDigits(sp))).toMatchObject({ ok: true, data: { region: "8", regionName: "SP" } });
  });

  test("rejections", () => {
    expect(v("BR_CPF", "529.982.247-24")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("BR_CPF", "111.111.111-11")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("BR_CPF", "5299822472")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("BR_CPF", "529 982 247 25").ok).toBe(true);
  });

  const gen = (r: () => number) => withChecks(r, fromTemplate("#########", r), cpfCheckDigits, 2);

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_CPF"),
      generate: gen,
      allow: placeholder("BR_CPF"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({ spec: spec(documents, "BR_CPF"), generate: gen });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_CNPJ", () => {
  test("numeric and alphanumeric", () => {
    expect(v("BR_CNPJ", "11.222.333/0001-81")).toMatchObject({
      ok: true,
      formatted: "11.222.333/0001-81",
      data: { serial: "11222333", extra: { root: "11222333", branch: "0001", headquarters: true, alphanumeric: false } },
    });
    // Receita Federal's worked example in the alphanumeric CNPJ FAQ.
    expect(v("BR_CNPJ", "12.ABC.345/01DE-35")).toMatchObject({
      ok: true,
      data: { extra: { root: "12ABC345", branch: "01DE", headquarters: false, alphanumeric: true } },
    });
    expect(v("BR_CNPJ", "12abc34501de35").ok).toBe(true);
    expect(v("BR_CNPJ", "12ABC34501DE35")).toMatchObject({ ok: true, normalized: "12ABC34501DE35", data: { extra: { alphanumeric: true } } });
  });

  test("rejections", () => {
    expect(v("BR_CNPJ", "11222333000182")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("BR_CNPJ", "00000000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(v("BR_CNPJ", "12ABC34501DEA5")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid (numeric and alphanumeric)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_CNPJ"),
      generate: (r) => withChecks(r, fromTemplate(r() < 0.5 ? "############" : "XXXXXXXXXXXX", r), cnpjCheckDigits, 2),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_PIS", () => {
  test("valid and invalid", () => {
    expect(v("BR_PIS", "120.56412.54-5")).toMatchObject({ ok: true, formatted: "120.56412.54-5" });
    expect(v("BR_PIS", "12056412547")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("BR_PIS", "00000000000")).toMatchObject({ ok: false, reason: "invalid_range" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_PIS"),
      generate: (r) => withChecks(r, fromTemplate("##########", r), (b) => String(pisCheckDigit(b)), 1),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_TITULO_ELEITOR", () => {
  test("extracts the UF", () => {
    expect(v("BR_TITULO_ELEITOR", "0043 5687 09 06")).toMatchObject({
      ok: true,
      formatted: "0043 5687 09 06",
      data: { region: "09", regionName: "SC", serial: "00435687" },
    });
    // SP/MG: remainder 0 gives check digit 1.
    const sp = "1234567801";
    expect(tituloCheckDigits(sp)).toMatch(/^\d\d$/);
    expect(v("BR_TITULO_ELEITOR", sp + tituloCheckDigits(sp))).toMatchObject({ ok: true, data: { regionName: "SP" } });
  });

  test("rejections", () => {
    expect(v("BR_TITULO_ELEITOR", "004356872906")).toMatchObject({ ok: false, reason: "invalid_format" }); // UF 29
    expect(v("BR_TITULO_ELEITOR", "004356870907")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_TITULO_ELEITOR"),
      generate: (r) => withChecks(r, fromTemplate("########[0-2]#", r), tituloCheckDigits, 2),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_CNH", () => {
  test("valid and invalid", () => {
    expect(v("BR_CNH", "026503064-61")).toMatchObject({ ok: true, formatted: "026503064-61", data: { serial: "026503064" } });
    expect(v("BR_CNH", "02650306462")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_CNH"),
      generate: (r) => withChecks(r, fromTemplate("#########", r), cnhCheckDigits, 2),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_RG", () => {
  test("SSP-SP check character", () => {
    expect(v("BR_RG", "12.345.678-2")).toMatchObject({ ok: true, data: { serial: "12345678", extra: { scheme: "SSP-SP" } } });
    const x = ["10000001", "10000002", "10000003", "10000004", "10000005", "10000006", "10000007", "10000008", "10000009"].find(
      (b) => rgSpCheck(b) === "X",
    )!;
    expect(v("BR_RG", (x + "x").toLowerCase())).toMatchObject({ ok: true });
    expect(v("BR_RG", "123456783")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("agrees with idnumbers (dotted form)", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_RG"),
      generate: (r) => {
        const b = fromTemplate("########", r);
        return b + (r() < 0.5 ? rgSpCheck(b) : fromTemplate("[0-9X]", r));
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("BR_PASAPORTE", () => {
  test("shape", () => {
    expect(v("BR_PASAPORTE", "fa 123456")).toMatchObject({ ok: true, normalized: "FA123456" });
    expect(v("BR_PASAPORTE", "F1234567")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "BR_PASAPORTE"),
      generate: (r) => fromTemplate("[A-Z1][A-Z]######", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
