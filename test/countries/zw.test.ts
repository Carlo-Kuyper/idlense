import { describe, expect, test } from "vitest";
import { documents, ZW_CHECK_LETTERS, ZW_DISTRICTS, zwCheckLetter } from "../../src/countries/zw.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const ZW = spec(documents, "ZW_NID");
describeContract(documents);

/** idnumbers' rule: digit sum mod 23. */
const digitSumLetter = (digits: string) => ZW_CHECK_LETTERS[[...digits].reduce((a, c) => a + Number(c), 0) % 23]!;

describe("ZW_NID", () => {
  test("extracts district and office", () => {
    expect(check(ZW, "63-123456 B 02")).toMatchObject({
      ok: true,
      normalized: "63123456B02",
      formatted: "63-123456 B 02",
      data: { region: "02", serial: "123456", extra: { registrationOffice: "63", checkLetter: "B" } },
    });
    expect(check(ZW, "63123456b02").ok).toBe(true);
  });

  test("7-digit sequence and foreigners", () => {
    expect(zwCheckLetter("751234567")).toBe("L");
    expect(check(ZW, "751234567L00")).toMatchObject({
      ok: true,
      data: { citizenship: "foreigner", region: "00", serial: "1234567" },
    });
    expect(check(ZW, "75-1234567-L-00")).toMatchObject({ ok: true, formatted: "75-1234567 L 00" });
  });

  test("check letter is the whole number mod 23, not the digit sum", () => {
    // idnumbers' own example has a digit-sum letter
    expect(check(ZW, "63123456G02")).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("rejections", () => {
    expect(check(ZW, "01123456X02")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(ZW, "63123456B01")).toMatchObject({ ok: false, reason: "invalid_range" });
    expect(check(ZW, "63123456I02")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(check(ZW, "6312345B02")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except the check-letter rule", () => {
    const codes = [...ZW_DISTRICTS];
    const res = compareWithOracle({
      spec: ZW,
      generate: (r) => {
        const pick = () => (r() < 0.9 ? codes[Math.floor(r() * codes.length)]! : fromTemplate("##", r));
        const digits = pick() + fromTemplate(r() < 0.5 ? "######" : "#######", r);
        const x = r();
        const letter = x < 0.45 ? zwCheckLetter(digits) : x < 0.9 ? digitSumLetter(digits) : fromTemplate("A", r);
        return digits + letter + (r() < 0.1 ? "00" : pick());
      },
      // Only excused where the two rules give different letters; where they coincide we must agree.
      allow: (s) => {
        const digits = s.slice(0, -3);
        return zwCheckLetter(digits) !== digitSumLetter(digits) ? "check letter = number mod 23 (idnumbers: digit sum)" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
