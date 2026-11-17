import { describe, expect, test } from "vitest";
import { documents, normalizeNrc } from "../../src/countries/mm.js";
import { describeContract } from "../helpers/contract.js";
import { check, spec } from "../helpers/oracle.js";

describeContract(documents);
const NRC = spec(documents, "MM_NRC");

describe("MM_NRC", () => {
  test("Latin transliteration", () => {
    expect(check(NRC, "12/MaBaNa(N)123456")).toMatchObject({
      ok: true,
      normalized: "12/MABANA(N)123456",
      data: { citizenship: "citizen", region: "12", serial: "123456", extra: { township: "MABANA", citizenshipClass: "N" } },
    });
    expect(check(NRC, "1 / KaMaTa (E) 000001")).toMatchObject({ ok: true, data: { citizenship: "associate_citizen", region: "1" } });
    expect(check(NRC, "14/PaThaNa(P)000001")).toMatchObject({ ok: true, data: { citizenship: "naturalized_citizen", region: "14" } });
    expect(check(NRC, "12/MaBaNa(Naing)123456")).toMatchObject({ ok: true, normalized: "12/MABANA(N)123456" });
  });

  // mm-nric's sample shape: 12/PABADA(N)0XXXXX.
  test("published sample shape", () => {
    expect(check(NRC, "12/PABADA(N)012345").ok).toBe(true);
  });

  test("Burmese script", () => {
    const burmese = "၁၂/မဘန(နိုင်)၁၂၃၄၅၆";
    expect(normalizeNrc(burmese)).toBe("12/မဘန(N)123456");
    expect(check(NRC, burmese)).toMatchObject({ ok: true, data: { citizenship: "citizen", region: "12", serial: "123456", extra: { township: "မဘန" } } });
    expect(check(NRC, "၁၂/မဘန(ဧည့်)၁၂၃၄၅၆")).toMatchObject({ ok: true, data: { citizenship: "associate_citizen" } });
    expect(check(NRC, "၁၂/မဘန(ပြု)၁၂၃၄၅၆")).toMatchObject({ ok: true, data: { citizenship: "naturalized_citizen" } });
  });

  test("rejections", () => {
    expect(check(NRC, "15/MaBaNa(N)123456")).toMatchObject({ ok: false, reason: "invalid_format" }); // state 1-14
    expect(check(NRC, "0/MaBaNa(N)123456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NRC, "12/MaBaNa(X)123456")).toMatchObject({ ok: false, reason: "invalid_format" }); // unknown class
    expect(check(NRC, "12/MaBaNa(N)12345")).toMatchObject({ ok: false, reason: "invalid_format" }); // 5-digit serial
    expect(check(NRC, "12MaBaNaN123456")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(NRC, "1/K(N)12345")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
