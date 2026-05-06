// Re-rotates variant + vorteile_label for all configs without calling the API.
import { readdir, readFile, writeFile } from "node:fs/promises";

const VARIANTS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
const LABELS = [
  "Ihre Vorteile",
  "Unsere Stärken",
  "Das macht uns aus",
  "Warum wir",
  "Unser Versprechen",
  "Gute Gründe",
  "Unsere Stärken",
  "Unsere Qualitäten",
  "Highlights",
  "Premium-Werte",
  "Unsere Mission",
  "Was uns ausmacht",
];

const files = (await readdir("configs")).filter((f) => f.endsWith(".json"));

// Sort for stable rotation; index-based for even distribution across all 6 variants
files.sort();
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const id = file.replace(".json", "");
  const path = `configs/${file}`;
  const cfg = JSON.parse(await readFile(path, "utf-8"));
  cfg.variant = VARIANTS[i % VARIANTS.length];
  cfg.vorteile_label = LABELS[i % LABELS.length];
  await writeFile(path, JSON.stringify(cfg, null, 2));
  console.log(`✓ ${id}  →  variant=${cfg.variant}  label="${cfg.vorteile_label}"`);
}
