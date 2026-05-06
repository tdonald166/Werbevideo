// Default: rendert nur Cinematic Horizontal (1 Video pro Kunde).
//
// Usage:
//   npm run render -- <id>                  → cinematic-h (Standard)
//   npm run render -- <id> --all            → alle 3 Stile, beide Formate (6 Videos)
//   npm run render -- <id> --style neon     → nur Neon Horizontal
//   npm run render -- <id> --vertical       → cinematic-v zusätzlich
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const id = args[0];
if (!id) {
  console.error("Usage: npm run render -- <config-id> [--all] [--style classic|cinematic|neon] [--vertical]");
  process.exit(1);
}

const cfg = `configs/${id}.json`;
if (!existsSync(cfg)) {
  console.error(`Config not found: ${cfg}`);
  process.exit(1);
}

const flagAll = args.includes("--all");
const flagVertical = args.includes("--vertical");
const styleIdx = args.indexOf("--style");
const styleArg = styleIdx >= 0 ? args[styleIdx + 1] : "cinematic";

const STYLES = {
  classic:   { hSuffix: "-h",           vSuffix: "-v" },
  cinematic: { hSuffix: "-cinematic-h", vSuffix: "-cinematic-v" },
  neon:      { hSuffix: "-neon-h",      vSuffix: "-neon-v" },
};

const run = (compId, outFile) =>
  new Promise((resolve, reject) => {
    const p = spawn("npx", ["remotion", "render", compId, `out/${outFile}`], {
      stdio: "inherit",
      shell: true,
    });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });

let jobs = [];
if (flagAll) {
  for (const [name, s] of Object.entries(STYLES)) {
    jobs.push({ comp: `${id}${s.hSuffix}`, out: `${id}-${name}-h.mp4`, label: `${name} H` });
    jobs.push({ comp: `${id}${s.vSuffix}`, out: `${id}-${name}-v.mp4`, label: `${name} V` });
  }
} else {
  const s = STYLES[styleArg];
  if (!s) {
    console.error(`Unknown style: ${styleArg}. Available: classic, cinematic, neon`);
    process.exit(1);
  }
  jobs.push({ comp: `${id}${s.hSuffix}`, out: `${id}-${styleArg}-h.mp4`, label: `${styleArg} H` });
  if (flagVertical) {
    jobs.push({ comp: `${id}${s.vSuffix}`, out: `${id}-${styleArg}-v.mp4`, label: `${styleArg} V` });
  }
}

for (const job of jobs) {
  console.log(`\n▶ ${job.label}…`);
  await run(job.comp, job.out);
}
console.log(`\n✓ Done. ${jobs.length} file(s) in out/`);
