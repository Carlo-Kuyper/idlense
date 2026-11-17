import { describe, expect, test } from "vitest";
import { documents, lkCheckDigit, lkDayToDate } from "../../src/countries/lk.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, REF, spec } from "../helpers/oracle.js";

const LK = spec(documents, "LK_NIC");
const v = (s: string) => check(LK, s, REF);
describeContract(documents);

/** 12-digit number with a correct check digit. */
const withCheck = (first11: string) => first11 + lkCheckDigit(first11);
/** Old 10-char number from YYDDDSSS with a correct check digit. */
const oldWithCheck = (first8: string, letter = "V") =>
  first8 + lkCheckDigit(`19${first8.slice(0, 5)}0${first8.slice(5)}`) + letter;

describe("LK_NIC", () => {
  test("old format (Wikipedia specimen)", () => {
    expect(v("911042754V")).toMatchObject({
      ok: true,
      data: {
        dateOfBirth: "1991-04-13",
        birthYear: 1991,
        gender: "male",
        serial: "0275",
        extra: { format: "old", newNumber: "199110402754", voterLetter: "V" },
      },
    });
    expect(v("911042754v")).toMatchObject({ ok: true });
    expect(v(oldWithCheck("80515123", "X"))).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1980-01-15", gender: "female", extra: { voterLetter: "X" } },
    });
  });

  test("new format", () => {
    expect(v("199010400273")).toMatchObject({
      ok: true,
      data: { dateOfBirth: "1990-04-13", gender: "male", serial: "0027", extra: { format: "new" } },
    });
    expect(v(withCheck("20055150123"))).toMatchObject({ ok: true, data: { dateOfBirth: "2005-01-15", gender: "female" } });
  });

  test("366-day year: February always has 29 days", () => {
    expect(lkDayToDate(60)).toEqual({ month: 2, day: 29 });
    expect(lkDayToDate(61)).toEqual({ month: 3, day: 1 });
    expect(lkDayToDate(366)).toEqual({ month: 12, day: 31 });
    expect(v(withCheck("19912680044"))).toMatchObject({ ok: true, data: { dateOfBirth: "1991-09-24" } });
    expect(v(withCheck("19920600044"))).toMatchObject({ ok: true, data: { dateOfBirth: "1992-02-29" } });
    expect(v(withCheck("19925600044"))).toMatchObject({ ok: true, data: { dateOfBirth: "1992-02-29", gender: "female" } });
    expect(v(withCheck("19910600044"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v(withCheck("19910610044"))).toMatchObject({ ok: true, data: { dateOfBirth: "1991-03-01" } });
    expect(v(withCheck("19913660044"))).toMatchObject({ ok: true, data: { dateOfBirth: "1991-12-31" } });
  });

  test("rejections", () => {
    expect(v(withCheck("19900000044"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v(withCheck("19903670044"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v(withCheck("19908670044"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v(withCheck("20301010044"))).toMatchObject({ ok: false, reason: "invalid_date" });
    expect(v("911042755V")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(v("911042754Y")).toMatchObject({ ok: false, reason: "invalid_format" });
    expect(v("91104275V")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except documented fixes", () => {
    const res = compareWithOracle({
      spec: LK,
      generate: (r) => {
        const right = r() < 0.6;
        if (r() < 0.5) {
          const first8 = fromTemplate("##[0-8]#####", r);
          return right ? oldWithCheck(first8, fromTemplate("[VX]", r)) : first8 + fromTemplate("#[VX]", r);
        }
        const first11 = fromTemplate("[12][09]##[0-8]######", r);
        return right ? withCheck(first11) : first11 + fromTemplate("#", r);
      },
      samples: 10000,
      allow: (s, ours) => {
        if (ours) return undefined;
        const r = v(s);
        return !r.ok && r.reason === "invalid_date" ? "unissued day number or future date rejected" : undefined;
      },
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});
