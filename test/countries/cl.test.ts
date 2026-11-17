import { describe, expect, test } from "vitest";
import { documents, formatRut, rutCheck } from "../../src/countries/cl.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

const RUT = spec(documents, "CL_RUT");
const gen = (body: string) => (r: () => number) => {
  const b = fromTemplate(body, r);
  return b + (r() < 0.6 ? rutCheck(b) : fromTemplate("[0-9K]", r));
};

describe("CL_RUT", () => {
  test("extracts and formats", () => {
    expect(v("CL_RUT", "12.345.678-5")).toMatchObject({ ok: true, formatted: "12.345.678-5", data: { serial: "12345678" } });
    expect(v("CL_RUT", "12345678-4")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("K check character, any case", () => {
    const body = ["1000000", "1000001", "1000002", "1000003", "1000004", "1000005", "1000006", "1000007", "1000008", "1000009", "1000010"].find(
      (b) => rutCheck(b) === "K",
    )!;
    expect(v("CL_RUT", formatRut(body + "K").toLowerCase())).toMatchObject({ ok: true, normalized: body + "K" });
  });

  test("7-digit bodies use weights from the right", () => {
    // 5.126.663-3: 3·2+6·3+6·4+6·5+2·6+1·7+5·2 = 107, 107 mod 11 = 8, 11-8 = 3
    expect(v("CL_RUT", "5.126.663-3")).toMatchObject({ ok: true, formatted: "5.126.663-3" });
  });

  test("rejections", () => {
    expect(v("CL_RUT", "1-9")).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(v("CL_RUT", "01234567-4")).toMatchObject({ ok: false, reason: "invalid_format" });
  });

  test("agrees with idnumbers on 8-digit bodies", () => {
    const res = compareWithOracle({
      spec: RUT,
      generate: gen("[1-9]#######"),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("differs from idnumbers on 7-digit bodies only by its weight bug", () => {
    const res = compareWithOracle({
      spec: RUT,
      generate: gen("[1-9]######"),
      // idnumbers weights 7-digit bodies 3,2,7,6,5,4,3 from the left instead of 2,7,6,5,4,3,2.
      allow: (s) => {
        const body = s.slice(0, -1);
        const w = [3, 2, 7, 6, 5, 4, 3];
        let sum = 0;
        for (let i = 0; i < 7; i++) sum += Number(body[i]) * w[i]!;
        const dv = 11 - (sum % 11);
        const buggy = dv === 11 ? "0" : dv === 10 ? "K" : String(dv);
        return buggy !== rutCheck(body) ? "idnumbers mis-weights 7-digit bodies" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });

  test("agrees with nationid except short bodies", () => {
    const res = compareWithOracle({
      spec: RUT,
      generate: (r) => gen(fromTemplate("[1-9]", r) + "#".repeat(Math.floor(r() * 8)))(r),
      allow: (s, ours) => {
        if (ours) return undefined;
        const res = v("CL_RUT", s);
        return !res.ok && res.reason === "invalid_length" ? "bodies under 7 digits rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("CL_PASAPORTE", () => {
  test("agrees with nationid", () => {
    const res = compareWithOracle({
      spec: spec(documents, "CL_PASAPORTE"),
      generate: (r) => fromTemplate(r() < 0.5 ? "XXXXXXXX" : "XXXXXXXXX", r),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
