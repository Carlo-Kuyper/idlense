/**
 * Differential testing against the upstream libraries we ported from
 * (dev dependencies only; nothing ships with them).
 *
 * Generates many candidate numbers, asks both our module and the upstream
 * validator, and returns every disagreement that isn't explained by `allow`.
 * A divergence is fine only when it is a deliberate fix: `allow` must return
 * a short reason for it, and the module's header comment should say why.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import type { DocumentSpec } from "../../src/core/types.js";
import { runDocument } from "../../src/core/run.js";

export const REF = new Date(2026, 10, 16);

/** Deterministic PRNG so failures reproduce. */
export function rng(seed = 42): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random string from a template: `#` digit, `A` letter, `X` alnum,
 * `[abc]` one of the chars, anything else literal.
 * e.g. template("[0-2]#[01]#[0-3]#####")
 */
export function fromTemplate(tpl: string, rand: () => number): string {
  const pick = (s: string) => s[Math.floor(rand() * s.length)]!;
  let out = "";
  for (let i = 0; i < tpl.length; i++) {
    const c = tpl[i]!;
    if (c === "#") out += pick("0123456789");
    else if (c === "A") out += pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    else if (c === "X") out += pick("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    else if (c === "[") {
      const end = tpl.indexOf("]", i);
      let set = "";
      const body = tpl.slice(i + 1, end);
      for (let k = 0; k < body.length; k++) {
        if (body[k + 1] === "-" && body[k + 2]) {
          for (let x = body.charCodeAt(k); x <= body.charCodeAt(k + 2); x++) set += String.fromCharCode(x);
          k += 2;
        } else set += body[k];
      }
      out += pick(set);
      i = end;
    } else out += c;
  }
  return out;
}

export interface OracleOptions {
  spec: DocumentSpec;
  /**
   * Upstream verdict for the same input. Only called when recording
   * (`UPSTREAM_RECORD=1`); normal runs replay the verdicts saved in
   * test/fixtures/upstream/, so the upstream packages aren't needed.
   */
  oracle?: (input: string) => boolean;
  /** Candidate generator; aim for a decent share of valid numbers. */
  generate: (rand: () => number) => string;
  samples?: number;
  /** Return a reason when a disagreement is a deliberate, documented fix. */
  allow?: (input: string, ours: boolean, theirs: boolean) => string | undefined;
  seed?: number;
}

// --- recorded upstream verdicts ---------------------------------------------

const FIXTURE_DIR = fileURLToPath(new URL("../fixtures/upstream/", import.meta.url));
const RECORDING = process.env.UPSTREAM_RECORD === "1";

interface Recording {
  samples: number;
  /** FNV-1a of all generated inputs, to catch a changed generator. */
  inputsHash: string;
  /** Upstream verdicts as a base64 bitset, one bit per sample. */
  verdicts: string;
}

const fixtureCache = new Map<string, Record<string, Recording>>();
const callCounts = new Map<string, number>();

function fnv1a(parts: string[]): string {
  let h = 0x811c9dc5;
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) h = Math.imul(h ^ p.charCodeAt(i), 0x01000193) >>> 0;
    h = Math.imul(h ^ 0x1f, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function fixtureFile(): { file: string; key: string } {
  const state = expect.getState();
  const testFile = basename(state.testPath ?? "unknown").replace(/\.test\.ts$/, "");
  const test = state.currentTestName ?? "unknown";
  const n = (callCounts.get(testFile + "|" + test) ?? 0) + 1;
  callCounts.set(testFile + "|" + test, n);
  return { file: join(FIXTURE_DIR, testFile + ".json"), key: n === 1 ? test : `${test} #${n}` };
}

function loadFixtures(file: string): Record<string, Recording> {
  let f = fixtureCache.get(file);
  if (!f) {
    f = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, Recording>) : {};
    fixtureCache.set(file, f);
  }
  return f;
}

function encodeBits(bits: boolean[]): string {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  bits.forEach((b, i) => {
    if (b) bytes[i >> 3]! |= 1 << (i & 7);
  });
  return Buffer.from(bytes).toString("base64");
}

function decodeBits(b64: string, n: number): boolean[] {
  const bytes = Buffer.from(b64, "base64");
  return Array.from({ length: n }, (_, i) => ((bytes[i >> 3]! >> (i & 7)) & 1) === 1);
}

/**
 * Compare our module with an upstream library over generated inputs.
 * Upstream verdicts come from the recorded fixture (or from `oracle` when
 * recording). Returns every disagreement `allow` doesn't explain.
 */
export function compareWithOracle(opts: OracleOptions) {
  const { spec } = opts;
  const rand = rng(opts.seed);
  const n = opts.samples ?? 3000;
  const inputs = Array.from({ length: n }, () => opts.generate(rand));
  const inputsHash = fnv1a(inputs);

  const { file, key } = fixtureFile();
  const fixtures = loadFixtures(file);
  let theirsAll: boolean[];
  if (RECORDING) {
    if (!opts.oracle) throw new Error(`recording ${key}: no oracle given`);
    theirsAll = inputs.map((input) => {
      try {
        return opts.oracle!(input);
      } catch {
        return false;
      }
    });
    fixtures[key] = { samples: n, inputsHash, verdicts: encodeBits(theirsAll) };
    mkdirSync(FIXTURE_DIR, { recursive: true });
    writeFileSync(file, JSON.stringify(fixtures, null, 1) + "\n");
  } else {
    const rec = fixtures[key];
    if (!rec) throw new Error(`no recorded upstream verdicts for "${key}" in ${basename(file)}`);
    if (rec.samples !== n || rec.inputsHash !== inputsHash) {
      throw new Error(`recorded verdicts for "${key}" are stale: the generator, seed or sample count changed`);
    }
    theirsAll = decodeBits(rec.verdicts, n);
  }

  const unexplained: { input: string; ours: boolean; theirs: boolean }[] = [];
  const explained = new Map<string, number>();
  let validSeen = 0;
  inputs.forEach((input, i) => {
    const ours = runDocument(spec, input, REF).outcome.ok;
    const theirs = theirsAll[i]!;
    if (ours) validSeen++;
    if (ours === theirs) return;
    const why = opts.allow?.(input, ours, theirs);
    if (why) explained.set(why, (explained.get(why) ?? 0) + 1);
    else if (unexplained.length < 10) unexplained.push({ input, ours, theirs });
  });
  return { unexplained, explained: Object.fromEntries(explained), validSeen, samples: n };
}

/** Like validateDocument() but for a spec object, so country tests don't depend on the registry. */
export function check(spec: DocumentSpec, input: string, referenceDate = REF) {
  const { normalized, outcome } = runDocument(spec, input, referenceDate);
  if (!outcome.ok) return { ok: false as const, normalized, reason: outcome.reason };
  return { ok: true as const, normalized, formatted: spec.format ? spec.format(normalized) : normalized, data: outcome.data };
}

/** Find a spec in a country's documents by code. */
export function spec(docs: readonly DocumentSpec[], code: string): DocumentSpec {
  const d = docs.find((x) => x.code === code);
  if (!d) throw new Error("no spec " + code);
  return d;
}
