import { describe, expect, test } from "vitest";
import { documents, ieCheckLetter } from "../../src/countries/ie.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const v = (code: string, s: string) => check(spec(documents, code), s, REF);
describeContract(documents);

describe("IE_PPSN", () => {
  test("valid forms", () => {
    expect(v("IE_PPSN", "1234567T")).toMatchObject({ ok: true, data: { serial: "1234567", extra: {} } });
    expect(v("IE_PPSN", "1234567tw")).toMatchObject({ ok: true, data: { extra: { secondLetter: "W" } } });
    expect(v("IE_PPSN", "1234567TX")).toMatchObject({ ok: true });
    expect(v("IE_PPSN", "1234567" + ieCheckLetter("1234567", "A") + "A")).toMatchObject({ ok: true, data: { extra: { secondLetter: "A" } } });
    expect(ieCheckLetter("1234567", "A")).toBe("F"); // 112 + 9 = 121 → 6 → F
  });
  test("rejections", () => {
    expect(v("IE_PPSN", "1234567TA")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IE_PPSN", "1234567S")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("IE_PPSN", "1234567TC")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("IE_PPSN", "123456T")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
  test("agrees with idnumbers except second-letter rule", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IE_PPSN"),
      generate: (r) => (r() < 0.5 ? fromTemplate("#######[A-W]", r) : fromTemplate("#######[A-W][A-X]", r)),
      samples: 20000,
      // We only count A/B/H; W/T/X are ignored legacy suffixes; others are unissued.
      allow: (s) => (s.length === 9 && !"ABHW".includes(s[8]!) ? "second letter other than A/B/H/W" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("IE_VAT", () => {
  test("forms", () => {
    expect(v("IE_VAT", "IE 6433435F")).toMatchObject({ ok: true, normalized: "IE6433435F", data: { extra: { form: "new" } } });
    expect(v("IE_VAT", "6433435F")).toMatchObject({ ok: true, normalized: "IE6433435F" });
    // old form 8Z49289F → new form 0492898 + F
    expect(ieCheckLetter("0492898")).toBe("F");
    expect(v("IE_VAT", "IE8Z49289F")).toMatchObject({ ok: true, data: { extra: { form: "old" } } });
    expect(v("IE_VAT", "IE8+49289F")).toMatchObject({ ok: true });
    expect(v("IE_VAT", "IE6433435" + ieCheckLetter("6433435", "H") + "H")).toMatchObject({ ok: true });
    expect(v("IE_VAT", "IE6433435G")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });
  test("agrees with nationid except old form and B/H", () => {
    const res = compareWithOracle({
      spec: spec(documents, "IE_VAT"),
      generate: (r) => {
        const x = r();
        if (x < 0.4) return fromTemplate("IE#######[A-W]", r);
        if (x < 0.8) return fromTemplate("IE#######[A-W][ABHW]", r);
        return fromTemplate("IE#[A-Z+]#####[A-W]", r);
      },
      samples: 20000,
      allow: (s, ours) => {
        if (ours && !/^IE\d{7}/.test(s)) return "old company form accepted";
        if (s.length === 11 && "BH".includes(s[10]!)) return "B/H second letter";
        return undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
