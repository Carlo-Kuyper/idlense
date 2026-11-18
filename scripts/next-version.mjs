// Decides the next release version for CI.
//
// Base: the version currently tagged `latest` on npm (or package.json's version before the first
// publish). Bump: read from the commit messages since the last `v*` git tag, using Conventional
// Commits:
//   "feat!: ..." / "BREAKING CHANGE" in the body  -> major (minor while still on 0.x)
//   "feat: ..."                                    -> minor
//   anything else                                  -> patch
//   only docs/ci/chore/test/style/build commits    -> no release
// Set BUMP=patch|minor|major to override (used by the manual "Run workflow" button).
//
// Writes `version=` and `publish=` to $GITHUB_OUTPUT when run in GitHub Actions.
import { execFileSync, execSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const quiet = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, quiet).trim();
  } catch {
    return "";
  }
};

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
let published = "";
try {
  // npm is a .cmd shim on Windows, so it needs a shell; the package name comes from our own package.json.
  published = execSync(`npm view ${pkg.name} dist-tags.latest`, quiet).trim();
} catch {
  // not published yet
}
const base = (published || pkg.version).split("-")[0];

const lastTag = sh("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"]);
const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
const commits = sh("git", ["log", range, "--format=%B%x00"])
  .split("\0")
  .map((c) => c.trim())
  .filter(Boolean);

const NO_RELEASE = /^(docs|ci|chore|test|style|build)(\(.+\))?:/i;
let bump = (process.env.BUMP ?? "auto").toLowerCase();
if (bump === "auto" || bump === "") {
  if (!published) bump = "initial";
  else if (commits.some((c) => /^\w+(\(.+\))?!:/.test(c) || /BREAKING[ -]CHANGE/.test(c))) bump = "major";
  else if (commits.some((c) => /^feat(\(.+\))?:/i.test(c))) bump = "minor";
  else if (commits.some((c) => !NO_RELEASE.test(c))) bump = "patch";
  else bump = "none";
}

let [major, minor, patch] = base.split(".").map(Number);
if (bump === "major" && major === 0) bump = "minor"; // 0.x: breaking changes bump minor
if (bump === "major") [major, minor, patch] = [major + 1, 0, 0];
else if (bump === "minor") [minor, patch] = [minor + 1, 0];
else if (bump === "patch") patch += 1;
else if (!["initial", "none"].includes(bump)) throw new Error(`Unknown BUMP "${bump}"`);

const version = `${major}.${minor}.${patch}`;
const publish = bump !== "none";
console.log(
  `${commits.length} commit(s) since ${lastTag || "the beginning"}; npm latest: ${published || "(unpublished)"}; ` +
    (publish ? `bump: ${bump} -> ${version}` : "no releasable commits, skipping publish"),
);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\npublish=${publish}\n`);
