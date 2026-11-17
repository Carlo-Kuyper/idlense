import { describe, expect, test } from "vitest";
import { documents, nuitCheckDigit } from "../../src/countries/mz.js";
import { describeContract } from "../helpers/contract.js";
import { check, fromTemplate, REF, rng, spec } from "../helpers/oracle.js";

const MZ = spec(documents, "MZ_NUIT");
describeContract(documents);

describe("MZ_NUIT", () => {
  test("extracts serial and type digit", () => {
    expect(check(MZ, "123456785", REF)).toMatchObject({
      ok: true,
      formatted: "123 456 785",
      data: { serial: "2345678", extra: { typeDigit: "1" } },
    });
  });

  test("remainder 10 is written as 1", () => {
    // find a body whose weighted sum is 10 mod 11 and check it ends in 1
    const rand = rng(7);
    let found = 0;
    for (let i = 0; i < 2000 && found < 5; i++) {
      const body = fromTemplate("########", rand);
      const sum = [8, 9, 4, 5, 6, 7, 8, 9].reduce((s, w, k) => s + w * Number(body[k]), 0);
      if (sum % 11 !== 10) continue;
      found++;
      expect(nuitCheckDigit(body)).toBe(1);
      expect(check(MZ, body + "1", REF).ok).toBe(true);
      expect(check(MZ, body + "0", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    }
    expect(found).toBe(5);
  });

  /**
   * Sample NUITs from python-stdnum's test suite ("found online and should all be valid"),
   * commit 1773a91: https://lists.arthurdejong.org/python-stdnum-commits/2025/msg00027.html
   * We list the ones starting with 4-7 (organisations). The 19 starting with 1 were also checked
   * and pass, but they may belong to individuals, so they aren't copied here.
   */
  const PUBLISHED = `400339910, 400 005 834, 500171650, 700152855, 400027145, 400001391, 400584291, 400872120,
    500001615, 400786704, 500 024 240, 400066183, 500006005, 401 191 607, 400 102 961, 500003545, 400787451,
    400509182, 400 006 245, 400778922, 400015546, 401343261, 401120807, 400 108 791, 400 415 870, 400007225,
    401508317, 400535825, 400418810, 401129006, 400058172, 400267839, 500017341, 700074854, 401215298,
    400058921, 400238685, 400005516, 500050012, 400 052 786, 400 111 200, 400824037, 400 410 151, 400157715,
    400370028, 400364001, 400551847, 400 769 052, 400 120 323, 401430989, 400316341, 400021260, 400129551,
    400187398, 600000063, 400102961, 400994579, 400905649, 500003839, 401041877, 400068038`
    .split(",")
    .map((s) => s.trim());

  test("every published sample validates", () => {
    expect(PUBLISHED.length).toBe(61);
    for (const s of PUBLISHED) expect(check(MZ, s, REF).ok, s).toBe(true);
    // stdnum's documented invalid-checksum sample
    expect(check(MZ, "101935626", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
  });

  test("documented example 400339910 (Σ = 209, mod 11 = 0)", () => {
    expect(check(MZ, "400339910", REF)).toMatchObject({ ok: true, data: { serial: "0033991", extra: { typeDigit: "4" } } });
  });

  test("rejections", () => {
    expect(check(MZ, "123456784", REF)).toMatchObject({ ok: false, reason: "invalid_checksum" });
    expect(check(MZ, "12345", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
    expect(check(MZ, "VV3456789", REF)).toMatchObject({ ok: false, reason: "invalid_length" });
  });
});
