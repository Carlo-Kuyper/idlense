import { describe, expect, test } from "vitest";
import { getDocument, identify, isValidId, listSupportedCountries, toAlpha2, validateDocument } from "../../src/index.js";
import { REF } from "../helpers/oracle.js";

describe("identify", () => {
  test("with a country", () => {
    const r = identify("8001015009087", { country: "zaf", referenceDate: REF });
    expect(r).toMatchObject({
      status: "valid",
      match: { country: "ZA", countryAlpha3: "ZAF", countryName: "South Africa", formatted: "800101 5009 087", data: { age: 46 } },
    });
  });

  test("detects the country", () => {
    expect(identify("8001015009087", { referenceDate: REF }).match?.country).toBe("ZA");
    expect(identify("17054026641", { referenceDate: REF }).match?.country).toBe("NO");
  });

  test("picks the right Norwegian variant", () => {
    expect(identify("57054026635", { country: "NO" }).match?.documents[0]?.code).toBe("NO_DNR");
  });

  test("health numbers need purposes", () => {
    expect(identify("17454026624", { country: "NO" }).status).toBe("invalid");
    expect(identify("17454026624", { country: "NO", purposes: ["health"] }).status).toBe("valid");
  });

  test("failures", () => {
    expect(identify("")).toMatchObject({ status: "invalid", reason: "empty" });
    expect(identify("123", { country: "QQ" })).toMatchObject({ reason: "unsupported_country" });
    const bad = identify("8001015009086", { country: "ZA" });
    expect(bad).toMatchObject({ status: "invalid", reason: "invalid_checksum" });
    expect(bad.rejections).toEqual([{ country: "ZA", code: "ZA_ID", reason: "invalid_checksum" }]);
    expect(isValidId("8001015009087", "ZA")).toBe(true);
    expect(isValidId("8001015009086")).toBe(false);
  });

  test("helpers", () => {
    expect(toAlpha2("nor")).toBe("NO");
    expect(toAlpha2("uk")).toBe("GB");
    expect(getDocument("za_id")?.country).toBe("ZA");
    expect(validateDocument("ZA_ID", "8001015009087", REF)).toMatchObject({ ok: true, data: { age: 46 } });
    expect(listSupportedCountries().find((c) => c.alpha2 === "NO")?.documents.length).toBe(4);
  });
});

describe("territories", () => {
  test("a territory tries its parent's documents", () => {
    const r = identify("17054026641", { country: "SJ", referenceDate: REF });
    expect(r).toMatchObject({ status: "valid", match: { country: "NO" } });
    expect(identify("8001015009087", { country: "PR" }).status).toBe("invalid");
  });
});
