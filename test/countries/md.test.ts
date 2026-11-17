import { describe, expect, test } from "vitest";
import { documents, mdIdnoCheckDigit } from "../../src/countries/md.js";
import { describeContract } from "../helpers/contract.js";
import { check, compareWithOracle, fromTemplate, spec } from "../helpers/oracle.js";

const IDNP = spec(documents, "MD_IDNP");
describeContract(documents);

describe("MD_IDNP", () => {
  test("decodes the assignment year and office", () => {
    expect(check(IDNP, "2002001234567")).toMatchObject({
      ok: true,
      formatted: "2002 001 23456 7",
      data: { serial: "23456", extra: { assignmentYear: 2002, office: "001" } },
    });
    expect(check(IDNP, "0971234567890")).toMatchObject({ ok: true, data: { extra: {} } });
    expect(check(IDNP, "2999001234567")).toMatchObject({ ok: true, data: { extra: {} } });
  });

  test("rejections", () => {
    expect(check(IDNP, "1002001234567")).toMatchObject({ ok: false, reason: "invalid_format" }); // IDNO index
    expect(check(IDNP, "200200123456")).toMatchObject({ ok: false, reason: "invalid_length" });
  });

  test("agrees with idnumbers except the person index", () => {
    const res = compareWithOracle({
      spec: IDNP,
      generate: (r) => fromTemplate("[0-3]############", r),
      allow: (s, ours) => (!ours && !/^[02]/.test(s) ? "first digit must be 0 or 2 (natural person)" : undefined),
    });
    expect(res.unexplained).toEqual([]);
    expect(res.validSeen).toBeGreaterThan(20);
  });
});

describe("MD_IDNO", () => {
  const IDNO = spec(documents, "MD_IDNO");
  const withCheck = (first12: string) => first12 + mdIdnoCheckDigit(first12);

  // Real IDNOs from official lists: Moldtelecom (ASP register extract) and Moldovagaz (SFS large taxpayers 2021-22).
  test("published IDNOs", () => {
    expect(check(IDNO, "1002600048836")).toMatchObject({
      ok: true,
      formatted: "1 002 600 04883 6",
      data: { serial: "04883", extra: { assignmentYear: 2002, office: "600" } },
    });
    expect(check(IDNO, "1003600005148")).toMatchObject({ ok: true, data: { extra: { assignmentYear: 2003 } } });
  });

  test("check digit: 7,3,1 weights mod 10", () => {
    // 1·7 + 0·3 + 2·1 + 6·7 + 6·3 + 0·1 + 0·7 + 1·3 + 2·1 + 3·7 + 4·3 + 5·1 = 112 → 2.
    expect(mdIdnoCheckDigit("102660012345")).toBe(2);
    expect(check(IDNO, "1 026 600 12345 2")).toMatchObject({ ok: true, normalized: "1026600123452" });
  });

  test("1990s assignment years", () => {
    expect(check(IDNO, withCheck("199760012345"))).toMatchObject({ ok: true, data: { extra: { assignmentYear: 1997 } } });
  });

  test("rejections", () => {
    expect(check(IDNO, "1002600048837")).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(IDNO, withCheck("102760012345"))).toMatchObject({ ok: false, reason: "invalid_range" }); // 2027: future
    expect(check(IDNO, withCheck("150060012345"))).toMatchObject({ ok: false, reason: "invalid_range" }); // 2500
    expect(check(IDNO, "2002600048836")).toMatchObject({ ok: false, reason: "invalid_format" }); // IDNP index
    expect(check(IDNO, "100260004883")).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
