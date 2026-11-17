import { expect, test } from "vitest";
import { listDocuments } from "../src/identify.js";
import { describeContract } from "./helpers/contract.js";

const docs = listDocuments();

test("codes are unique", () => {
  const codes = docs.map((d) => d.code);
  expect(new Set(codes).size).toBe(codes.length);
});

describeContract(docs);
