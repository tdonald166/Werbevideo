// Extract structured ad config from a poster image using Claude Vision.
//
// Usage:
//   npm run extract -- public/<id>/poster.jpg
//   → erzeugt configs/<id>.json
//
// Or pass an explicit id:
//   npm run extract -- public/<id>/poster.jpg <id>

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const imagePath = process.argv[2];
let id = process.argv[3];

if (!imagePath) {
  console.error("Usage: npm run extract -- <image-path> [id]");
  process.exit(1);
}
if (!existsSync(imagePath)) {
  console.error(`File not found: ${imagePath}`);
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY missing. Set it in .env");
  process.exit(1);
}

// Auto-derive id from path if not given (public/foo/poster.jpg → foo)
if (!id) {
  const parts = imagePath.replace(/\\/g, "/").split("/");
  const idx = parts.indexOf("public");
  id = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : path.basename(imagePath, path.extname(imagePath));
}

const ext = path.extname(imagePath).toLowerCase().replace(".", "");
const mediaType = ({
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif",
}[ext]) ?? "image/jpeg";

console.log(`▶ Reading ${imagePath}…`);
const imgBuf = await readFile(imagePath);
const base64 = imgBuf.toString("base64");

const PROMPT = `Du bist ein Werbe-Profi. Extrahiere aus diesem Werbeposter alle Inhalte und gib sie EXAKT in folgendem JSON-Format zurück. Antworte NUR mit dem JSON, ohne Erklärung, ohne Markdown-Codeblock.

{
  "id": "${id}",
  "unternehmen": {
    "name": "<Firmenname genau wie im Poster>",
    "slogan": "<Slogan oder Claim, leer wenn keiner>"
  },
  "headline": "<Hauptüberschrift. Wenn 2-zeilig im Poster, dann mit \\\\n trennen>",
  "subheadline": "<Untertitel oder beschreibender Satz. 1-2 Sätze max.>",
  "vorteile": [
    { "titel": "<Vorteil 1, knapp>", "beschreibung": "<1-Zeiler>" },
    { "titel": "<Vorteil 2>", "beschreibung": "<...>" },
    { "titel": "<Vorteil 3>", "beschreibung": "<...>" }
  ],
  "cta": {
    "text": "<Call-to-Action Text z.B. 'Jetzt anrufen', 'Termin vereinbaren'>",
    "kicker": "<kurzer Hinweis-Text z.B. 'Termin sichern'>"
  },
  "kontakt": {
    "adresse_zeile1": "<Straße + Nr.>",
    "adresse_zeile2": "<PLZ + Ort>",
    "telefon_buero": "<Haupttelefon>",
    "telefon_lager": "<2. Telefon falls vorhanden, sonst leer>",
    "email": "<Email falls vorhanden, sonst leer>",
    "website": "<Website ohne https://, sonst leer>"
  },
  "oeffnungszeiten": {
    "mo_do": "<Mo-Do Zeiten falls erkennbar, sonst leer>",
    "fr": "<Fr Zeiten, sonst leer>",
    "hinweis": "<zusätzlicher Hinweis falls vorhanden>"
  },
  "design": {
    "primary":   "<Hex-Farbe der dominanten Markenfarbe, z.B. #0d3b6e>",
    "primaryLt": "<aufgehellte Variante davon>",
    "accent":    "<Hex-Farbe der Akzent-/Action-Farbe (oft Rot, Orange)>",
    "ink":       "#0a0a0a",
    "white":     "#ffffff",
    "fontHead":  "Oswald",
    "fontBody":  "Inter",
    "fontScript":"Caveat"
  },
  "assets": {
    "logo": null,
    "hero": "${id}/${path.basename(imagePath)}"
  }
}

WICHTIG:
- Wenn du etwas nicht erkennst, schreibe "" oder lasse das Feld leer (NICHT erfinden!)
- Bei Vorteilen: extrahiere höchstens 3, fasse ggf. zusammen
- Headline kurz halten — wenn das Poster eine sehr lange Headline hat, nimm den Kernteil

FARB-EXTRAKTION (sehr wichtig — bitte genau machen):
1. Identifiziere die DOMINANTE MARKENFARBE im Poster (typisch im Logo, in den Headlines, oder als Hintergrund-Akzent). Das wird "primary".
2. Identifiziere die AKZENT-FARBE (CTA-Buttons, Highlights, sekundäre Markenfarbe). Das wird "accent".
3. Sample die exakten Pixelfarben — gib echte Hex-Codes wie "#0d3b6e" zurück, NICHT generische wie "#0000ff" oder "#ff0000".
4. Bei Logos mit mehreren Farben: nimm die Farbe die am meisten Fläche einnimmt für "primary".
5. "primaryLt" = etwas hellere/gesättigtere Variante von "primary" (z.B. wenn primary #0d3b6e → primaryLt #1e5faf).
6. "accent" muss zur primary kontrastieren: bei Blau-Marke → Rot/Orange/Gold, bei Grün → Magenta/Rot, bei Rot → Gelb/Schwarz.
7. Bei monochromen Postern (z.B. nur schwarz/weiß): "primary" = #0a0a0a, "accent" = sichtbarste Farbe im Bild oder ein Standard-Akzent #dc2626.`;

const client = new Anthropic();

console.log(`▶ Calling Claude Vision (claude-sonnet-4-5)…`);
const message = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 2500,
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text", text: PROMPT },
    ],
  }],
});

const text = message.content.find((c) => c.type === "text")?.text ?? "";
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  console.error("No JSON found in response. Raw output:");
  console.error(text);
  process.exit(1);
}

let cfg;
try {
  cfg = JSON.parse(jsonMatch[0]);
} catch (e) {
  console.error("JSON parse error:", e.message);
  console.error("Raw text:", jsonMatch[0]);
  process.exit(1);
}

// Force id and hero to match what's on disk (KI darf nicht überschreiben)
cfg.id = id;
cfg.assets = cfg.assets || { logo: null, hero: null };
cfg.assets.hero = `${id}/${path.basename(imagePath)}`;

// Variant rotation based on hash of id — same id always → same variant
const VARIANTS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"];
const VORTEILE_LABELS = [
  "Ihre Vorteile",
  "Unsere Stärken",
  "Das macht uns aus",
  "Warum wir",
  "Unser Versprechen",
  "Gute Gründe",
];
const hash = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
cfg.variant = VARIANTS[hash % VARIANTS.length];
cfg.vorteile_label = VORTEILE_LABELS[hash % VORTEILE_LABELS.length];

await mkdir("configs", { recursive: true });
const outPath = `configs/${id}.json`;
await writeFile(outPath, JSON.stringify(cfg, null, 2), "utf-8");

console.log(`✓ Saved ${outPath}`);
console.log(`\nVorschau:`);
console.log(`  Firma:     ${cfg.unternehmen?.name}`);
console.log(`  Headline:  ${(cfg.headline || "").replace(/\n/g, " | ")}`);
console.log(`  Vorteile:  ${cfg.vorteile?.map((v) => v.titel).join(", ")}`);
console.log(`  Telefon:   ${cfg.kontakt?.telefon_buero}`);
console.log(`  Farben:    ${cfg.design?.primary} / ${cfg.design?.accent}`);
console.log(`\n→ Jetzt rendern: npm run render -- ${id}`);
