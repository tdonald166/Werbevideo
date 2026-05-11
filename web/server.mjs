// Web-UI Server fÃ¼r Werbevideo-Generator
//   Start:   npm run web
//   URL:     http://localhost:8080

import "dotenv/config";
// Polyfill globalThis.File fÃ¼r Node < 20 (OpenAI SDK braucht es fÃ¼r File-Uploads)
import { File as PolyFile, Blob as PolyBlob } from "formdata-node";
if (!globalThis.File) globalThis.File = PolyFile;
if (!globalThis.Blob) globalThis.Blob = PolyBlob;
import express from "express";
import multer from "multer";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { existsSync, createReadStream } from "node:fs";
import { readFile, writeFile, mkdir, readdir, stat, rename } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(path.join(ROOT, "out")));
app.use("/posters", express.static(path.join(ROOT, "public")));
app.use("/posters-out", express.static(path.join(ROOT, "out", "posters")));

// In-memory job tracking
const jobs = new Map(); // jobId â†’ { id, status, progress, total, startedAt, error }

// â”€â”€ Multer upload to temp folder â”€â”€
const upload = multer({
  dest: path.join(ROOT, "tmp-uploads"),
  limits: { fileSize: 30 * 1024 * 1024 },
});

// â”€â”€ Routes â”€â”€
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// List all existing configs (with hero preview + video status)
app.get("/api/configs", async (_req, res) => {
  try {
    const cfgsDir = path.join(ROOT, "configs");
    const files = (await readdir(cfgsDir)).filter((f) => f.endsWith(".json"));
    const list = await Promise.all(files.map(async (f) => {
      const id = f.replace(".json", "");
      const cfg = JSON.parse(await readFile(path.join(cfgsDir, f), "utf-8"));
      // Determine video file based on format
      const fmtSuffix = { landscape: "h", vertical: "v", square: "sq", portrait: "pt" }[cfg.format || "landscape"] || "h";
      // Try the format-specific file first, else fall back to any rendered cinematic file
      const candidates = [`${id}-cinematic-${fmtSuffix}.mp4`, `${id}-cinematic-h.mp4`, `${id}-cinematic-v.mp4`, `${id}-cinematic-sq.mp4`, `${id}-cinematic-pt.mp4`];
      let videoFile = null, videoMtime = 0;
      for (const c of candidates) {
        const p = path.join(ROOT, "out", c);
        if (existsSync(p)) {
          videoFile = c;
          videoMtime = (await stat(p)).mtimeMs;
          break;
        }
      }
      const hasVideo = !!videoFile;
      return {
        id,
        name: cfg.unternehmen?.name || id,
        slogan: cfg.unternehmen?.slogan || "",
        variant: cfg.variant || "a",
        format: cfg.format || "landscape",
        hero: cfg.assets?.hero || null,
        primary: cfg.design?.primary || "#0d3b6e",
        accent: cfg.design?.accent || "#dc2626",
        hasVideo,
        videoUrl: hasVideo ? `/videos/${videoFile}` : null,
        videoMtime,
      };
    }));
    list.sort((a, b) => b.videoMtime - a.videoMtime);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single config
app.get("/api/config/:id", async (req, res) => {
  try {
    const cfg = JSON.parse(
      await readFile(path.join(ROOT, "configs", `${req.params.id}.json`), "utf-8"),
    );
    res.json(cfg);
  } catch (e) {
    res.status(404).json({ error: "Config not found" });
  }
});

// Update config (after user edits)
app.put("/api/config/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const cfg = req.body;
    cfg.id = id;
    await writeFile(
      path.join(ROOT, "configs", `${id}.json`),
      JSON.stringify(cfg, null, 2),
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete config + assets + video
app.delete("/api/config/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const cfgPath = path.join(ROOT, "configs", `${id}.json`);
    const assetsDir = path.join(ROOT, "public", id);
    const fs = await import("node:fs/promises");
    if (existsSync(cfgPath)) await fs.unlink(cfgPath);
    // Alle Video-Formate lÃ¶schen
    for (const suffix of ["h", "v", "sq", "pt"]) {
      const f = path.join(ROOT, "out", `${id}-cinematic-${suffix}.mp4`);
      if (existsSync(f)) await fs.unlink(f);
    }
    if (existsSync(assetsDir)) await fs.rm(assetsDir, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ensure tmp-uploads exists
await mkdir(path.join(ROOT, "tmp-uploads"), { recursive: true });

// Upload poster + run AI extraction
app.post("/api/upload", upload.single("poster"), async (req, res) => {
  try {
    console.log("[upload] file:", req.file?.originalname, "size:", req.file?.size);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: "ANTHROPIC_API_KEY missing in .env" });

    // Generate id from filename or use random
    let id = (req.body.id || path.basename(req.file.originalname, path.extname(req.file.originalname)))
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!id || id.length < 2) id = "kunde-" + crypto.randomBytes(3).toString("hex");

    // Avoid id collision with existing config
    const cfgPath = path.join(ROOT, "configs", `${id}.json`);
    let n = 2;
    let finalId = id;
    while (existsSync(path.join(ROOT, "configs", `${finalId}.json`))) {
      finalId = `${id}-${n++}`;
    }

    // Move file to public/<id>/poster.<ext>
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "") || "png";
    const targetDir = path.join(ROOT, "public", finalId);
    await mkdir(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, `poster.${ext}`);
    // copyFile + unlink (rename can fail across volumes on Windows)
    const fsp = await import("node:fs/promises");
    await fsp.copyFile(req.file.path, targetFile);
    await fsp.unlink(req.file.path).catch(() => {});
    console.log("[upload] saved to:", targetFile, "id:", finalId);

    // Run extract-poster.mjs (use forward slashes for shell compat)
    const relImagePath = `public/${finalId}/poster.${ext}`;
    const proc = spawn("node", [
      "scripts/extract-poster.mjs",
      relImagePath,
      finalId,
    ], { cwd: ROOT, shell: true });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", async (code) => {
      console.log("[extract] exit code:", code);
      if (stdout) console.log("[extract] stdout:", stdout.slice(0, 500));
      if (stderr) console.log("[extract] stderr:", stderr.slice(0, 500));
      const cfgPath = path.join(ROOT, "configs", `${finalId}.json`);
      if (code !== 0 || !existsSync(cfgPath)) {
        return res.status(500).json({
          error: `Extraktion fehlgeschlagen (exit ${code}). ${stderr.slice(0, 200) || stdout.slice(-200) || ""}`.trim(),
        });
      }
      const cfg = JSON.parse(await readFile(cfgPath, "utf-8"));
      res.json({ id: finalId, config: cfg });
    });
  } catch (e) {
    console.error("[upload] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Create new config from template payload (no poster needed)
// â”€â”€â”€ Poster generieren via OpenAI gpt-image-1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const posterUpload = multer({
  dest: path.join(ROOT, "tmp-uploads"),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Webseite analysieren â€” gibt Text-Daten zurÃ¼ck (fÃ¼r Fall B)
app.post("/api/poster/analyze-website", express.json(), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: "ANTHROPIC_API_KEY fehlt in .env" });
    let url = (req.body?.url || "").trim();
    if (!url) return res.status(400).json({ error: "URL fehlt" });
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Reelmind/1.0)" },
      redirect: "follow",
    });
    if (!r.ok) return res.status(400).json({ error: `HTTP ${r.status}` });
    const html = await r.text();
    const text = htmlToText(html).slice(0, 20000);

    // Farb-Hinweise aus HTML extrahieren (theme-color, inline-CSS Hex-Codes)
    const colorHints = new Set();
    const themeColor = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
    if (themeColor) colorHints.add(themeColor[1]);
    const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const h of hexMatches.slice(0, 30)) colorHints.add(h.toLowerCase());
    const colorHintStr = [...colorHints].slice(0, 15).join(", ");

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1800,
      messages: [{ role: "user", content: [{ type: "text", text:
`Analysiere die Webseite und extrahiere Werbe-relevante Inhalte. Gib NUR JSON zurÃ¼ck:
{
  "unternehmen": "<Firmenname>",
  "branche": "<Branche>",
  "slogan": "<Slogan oder leer>",
  "leistungen": "<3-5 Leistungen kommagetrennt>",
  "adresse": "<Strasse PLZ Ort>",
  "telefon": "<Tel>",
  "email": "<Email>",
  "website": "<Domain ohne https>",
  "cta": "<Call-to-Action>",
  "primaerfarbe": "<Haupt-Markenfarbe als HEX, z.B. #1a4d8c>",
  "sekundaerfarbe": "<zweite Markenfarbe als HEX>",
  "bildmotive": "<2-3 konkrete photorealistische Hero-Bild-Motive passend zur Branche, kommagetrennt, z.B. 'gepflegte Pflegekraft mit Senior, modernes Pflegeheim-Interieur, freundlicher Empfangsbereich'>"
}
Lasse Felder leer wenn nicht erkennbar. Farb-Hinweise aus Seite: ${colorHintStr || "(keine erkannt)"}.

URL: ${url}

TEXT:
${text}` }] }],
    });
    const respText = message.content.find(c => c.type === "text")?.text ?? "";
    const m = respText.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Claude lieferte kein JSON");
    res.json(JSON.parse(m[0]));
  } catch (e) {
    console.error("[analyze-website] error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/poster/generate", posterUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "oldPoster", maxCount: 1 },
]), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY fehlt in .env. Hol dir einen Key auf https://platform.openai.com/api-keys" });
    }
    const { case: caseType = "A", prompt, format = "landscape" } = req.body || {};
    if (!prompt || prompt.trim().length < 20) {
      return res.status(400).json({ error: "Prompt ist zu kurz." });
    }

    // Format â†’ OpenAI Size
    const sizeMap = {
      landscape: "1536x1024",
      vertical:  "1024x1536",
      square:    "1024x1024",
      portrait:  "1024x1536",
    };
    const size = sizeMap[format] || "1536x1024";

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI();
    let posterBuffer;

    // Fall D: Bild + Prompt direkt an gpt-image-1 (kein Claude-Zwischenschritt â€” wie ChatGPT WebUI)
    const oldPosterFile = req.files?.oldPoster?.[0];
    if (caseType === "D" && oldPosterFile) {
      const fsp = await import("node:fs/promises");
      const rawBuf = await fsp.readFile(oldPosterFile.path);
      const pngBuf = await sharp(rawBuf).resize({ width: 1500, height: 1500, fit: "inside" }).png().toBuffer();
      await fsp.unlink(oldPosterFile.path).catch(() => {});

      console.log(`[poster] D: sending image + prompt directly to gpt-image-1 (${size})â€¦`);
      const fd = new FormData();
      fd.append("model", "gpt-image-1");
      fd.append("image", new Blob([pngBuf], { type: "image/png" }), "old-poster.png");
      fd.append("prompt", prompt.slice(0, 32000));
      fd.append("size", size);
      fd.append("n", "1");
      fd.append("quality", "high");

      const editResp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: fd,
      });
      if (!editResp.ok) {
        const errBody = await editResp.text();
        console.error("[poster] D: edits API error:", errBody);
        throw new Error(`OpenAI Edits ${editResp.status}: ${errBody.slice(0, 300)}`);
      }
      const editJson = await editResp.json();
      const b64 = editJson.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI gab kein Bild zurÃ¼ck");
      posterBuffer = Buffer.from(b64, "base64");
    } else {
      // Fall A/B/C: Claude-Prompt-Enhancer vorschalten (wie ChatGPT WebUI's prompt-rewrite)
      let finalPrompt = prompt;
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const client = new Anthropic();
          const enhMsg = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2500,
            messages: [{ role: "user", content: [{ type: "text", text:
`Du bist Senior-Art-Director einer Premium-Werbeagentur. Schreibe aus dem folgenden Briefing einen DETAILLIERTEN, layout-praezisen ENGLISCHEN Bild-Prompt fuer gpt-image-1, der ein hochwertiges B2B-Werbeposter erzeugt (Agentur-Niveau, NICHT generisch).

PFLICHT-ELEMENTE im finalen Prompt (in dieser Reihenfolge ins Bild bauen):
1. Top-Hero-Bereich (60% der Hoehe): GROSSES photorealistisches Hero-Foto rechte Haelfte/Hintergrund + Logo oben links auf Plaque/freigestellt + grosse mehrzeilige Bold-Headline (sans-serif, weiss, Akzent-Wort in Markensekundaerfarbe) + Subline + prominenter CTA-Button in Sekundaerfarbe mit Pfeil-Icon.
2. Service-Strip (dunkler Streifen, ca. 12% Hoehe): 5-6 Service-Punkte in einer Reihe â€” jeder mit Line-Icon in Sekundaerfarbe + 2-zeiliger Beschreibung.
3. Karten-Grid (ca. 22% Hoehe, heller Hintergrund): 4-5 weisse Karten mit abgerundeten Ecken, jede mit eigenem photorealistischen Bild oben + Titel in Caps + 1-Zeilen-Beschreibung + duenner Sekundaerfarb-Underline.
4. Bottom-Contact-Bar (ca. 6% Hoehe, dunkel): Telefon / Mail / Web mit Kreis-Icons in Sekundaerfarbe, gleichmaessig verteilt + rechts Akzent-Block in Sekundaerfarbe mit Claim.

REGELN:
- Markenfarben aus Briefing exakt verwenden (Hex-Werte zitieren).
- Typografie: schwere kondensierte Sans-Serif fuer Headlines (Caps), klare Sans fuer Body.
- ALLE Bilder photorealistisch, professionelle DSLR-Anmutung, KEINE Illustrationen, KEINE Cartoons, KEINE leeren Flaechen.
- Texte exakt aus Briefing uebernehmen (Firma, Telefon, Mail, Web, Adresse), KEINE Tippfehler, KEINE Platzhalter.
- Beschreibe Komposition als Werbeagentur-Mockup: Hierarchie, Weissraum, Kontrast, hohe Druckqualitaet.
- Format: ${size} ${format}.
- Antworte NUR mit dem fertigen englischen Prompt, kein Drumherum, keine Markdown-Fences.

BRIEFING:
${prompt}` }] }],
          });
          const enh = enhMsg.content.find(c => c.type === "text")?.text?.trim();
          if (enh && enh.length > 200) {
            finalPrompt = enh.replace(/^```[a-z]*\n?|\n?```$/g, "").trim();
            console.log(`[poster] ${caseType}: Claude-enhanced prompt (${finalPrompt.length} chars)`);
          }
        } catch (e) {
          console.warn("[poster] prompt-enhancer failed, using raw prompt:", e.message);
        }
      }

      console.log(`[poster] ${caseType}: generating ${size} with OpenAI gpt-image-1â€¦`);
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: finalPrompt,
        size,
        quality: "high",
        n: 1,
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI gab kein Bild zurÃ¼ck");
      posterBuffer = Buffer.from(b64, "base64");
    }

    // Logo oben links komponieren falls vorhanden (nur Fall A/B)
    const logoFile = req.files?.logo?.[0];
    if (logoFile && caseType !== "D") {
      try {
        const logoBuf = await readFile(logoFile.path);
        const fsp = await import("node:fs/promises");
        await fsp.unlink(logoFile.path).catch(() => {});

        const meta = await sharp(posterBuffer).metadata();
        const logoMaxW = Math.round((meta.width || 1024) * 0.18);
        const logoResized = await sharp(logoBuf)
          .resize({ width: logoMaxW, withoutEnlargement: true })
          .png()
          .toBuffer();
        const logoMeta = await sharp(logoResized).metadata();
        const padding = 20;
        const plaqueW = (logoMeta.width || logoMaxW) + padding * 2;
        const plaqueH = (logoMeta.height || 100) + padding * 2;
        const plaque = await sharp({
          create: { width: plaqueW, height: plaqueH, channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0.96 } },
        }).png().toBuffer();
        posterBuffer = await sharp(posterBuffer)
          .composite([
            { input: plaque, top: 30, left: 30 },
            { input: logoResized, top: 30 + padding, left: 30 + padding },
          ])
          .png().toBuffer();
        console.log("[poster] logo composited");
      } catch (e) {
        console.warn("[poster] logo composite failed:", e.message);
      }
    }

    // Speichern in tmp/poster-<id>.png
    const id = crypto.randomBytes(6).toString("hex");
    const tmpDir = path.join(ROOT, "out", "posters");
    await mkdir(tmpDir, { recursive: true });
    const outPath = path.join(tmpDir, `poster-${id}.png`);
    await writeFile(outPath, posterBuffer);

    res.json({
      id,
      url: `/posters-out/poster-${id}.png`,
      size,
    });
  } catch (e) {
    console.error("[poster] error:", e);
    const msg = e.code === "billing_hard_limit_reached" ? "OpenAI Billing-Limit erreicht."
              : e.message || "Generierung fehlgeschlagen";
    res.status(500).json({ error: msg });
  }
});

app.post("/api/config-from-template", async (req, res) => {
  try {
    const { template, name } = req.body;
    if (!template) return res.status(400).json({ error: "template payload missing" });

    // Generate a unique id from name
    let id = (name || template.placeholders?.unternehmen?.name || "neu")
      .toLowerCase().replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!id || id.length < 2) id = "kunde-" + crypto.randomBytes(3).toString("hex");
    let finalId = id;
    let n = 2;
    while (existsSync(path.join(ROOT, "configs", `${finalId}.json`))) {
      finalId = `${id}-${n++}`;
    }

    const cfg = {
      id: finalId,
      unternehmen: template.placeholders.unternehmen,
      headline: template.placeholders.headline,
      subheadline: template.placeholders.subheadline,
      vorteile: template.placeholders.vorteile,
      cta: template.placeholders.cta,
      kontakt: {
        adresse_zeile1: "", adresse_zeile2: "",
        telefon_buero: "", telefon_lager: "",
        email: "", website: "",
      },
      oeffnungszeiten: { mo_do: "", fr: "", hinweis: "" },
      design: template.design,
      assets: { logo: null, hero: null },
      variant: template.variant,
      vorteile_label: template.placeholders.vorteile_label,
      duration: template.duration,
      fontPreset: template.fontPreset,
    };
    await writeFile(path.join(ROOT, "configs", `${finalId}.json`),
      JSON.stringify(cfg, null, 2));
    res.json({ id: finalId, config: cfg });
  } catch (e) {
    console.error("[template] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€â”€ Upload assets (logo / hero / hero2) for an existing config â”€â”€
const bgUpload = multer({
  dest: path.join(ROOT, "tmp-uploads"),
  limits: { fileSize: 15 * 1024 * 1024 },
});
app.post("/api/config/:id/background", bgUpload.fields([
  { name: "hero", maxCount: 1 },
  { name: "hero2", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]), async (req, res) => {
  try {
    const id = req.params.id;
    const cfgPath = path.join(ROOT, "configs", `${id}.json`);
    if (!existsSync(cfgPath)) return res.status(404).json({ error: "Config not found" });
    const cfg = JSON.parse(await readFile(cfgPath, "utf-8"));
    const fsp = await import("node:fs/promises");
    const targetDir = path.join(ROOT, "public", id);
    await mkdir(targetDir, { recursive: true });

    const saveSlot = async (slotName, file) => {
      if (!file) return null;
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "") || "png";
      const dst = path.join(targetDir, `${slotName}.${ext}`);
      await fsp.copyFile(file.path, dst);
      await fsp.unlink(file.path).catch(() => {});
      return `${id}/${slotName}.${ext}`;
    };

    cfg.assets = cfg.assets || {};
    if (req.files?.hero?.[0])  cfg.assets.hero  = await saveSlot("hero",  req.files.hero[0]);
    if (req.files?.hero2?.[0]) cfg.assets.hero2 = await saveSlot("hero2", req.files.hero2[0]);
    if (req.files?.logo?.[0])  cfg.assets.logo  = await saveSlot("logo",  req.files.logo[0]);

    await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
    res.json({ ok: true, config: cfg });
  } catch (e) {
    console.error("[bg] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Delete an asset (hero / hero2 / logo)
app.delete("/api/config/:id/background/:slot", async (req, res) => {
  try {
    const id = req.params.id;
    const slot = req.params.slot; // "hero" | "hero2" | "logo"
    if (!["hero", "hero2", "logo"].includes(slot)) return res.status(400).json({ error: "Invalid slot" });
    const cfgPath = path.join(ROOT, "configs", `${id}.json`);
    if (!existsSync(cfgPath)) return res.status(404).json({ error: "Config not found" });
    const cfg = JSON.parse(await readFile(cfgPath, "utf-8"));
    const fsp = await import("node:fs/promises");
    if (cfg.assets?.[slot]) {
      const filePath = path.join(ROOT, "public", cfg.assets[slot]);
      if (existsSync(filePath)) await fsp.unlink(filePath).catch(() => {});
      cfg.assets[slot] = null;
    }
    await writeFile(cfgPath, JSON.stringify(cfg, null, 2));
    res.json({ ok: true, config: cfg });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€â”€ Aus Website: Claude analysiert URL + Logo â†’ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const websiteUpload = multer({
  dest: path.join(ROOT, "tmp-uploads"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const htmlToText = (html) => html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
  .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/\s+/g, " ").trim();

const findHeroImage = (html, baseUrl) => {
  const ogImg = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
              || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (ogImg) {
    try { return new URL(ogImg[1], baseUrl).toString(); } catch {}
  }
  return null;
};

// Sucht Logo-URLs in der Webseite â€” sortiert nach QualitÃ¤t (besser zuerst)
const findLogoUrls = (html, baseUrl) => {
  const cands = []; // { url, prio }

  // 1. JSON-LD Organization.logo (hÃ¶chste PrioritÃ¤t â€” strukturierte Daten)
  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldMatches) {
    try {
      const json = JSON.parse(m[1].trim());
      const arr = Array.isArray(json) ? json : [json];
      const queue = [...arr];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        if (item["@graph"]) queue.push(...item["@graph"]);
        const logo = item.logo;
        const logoUrl = typeof logo === "string" ? logo : (logo && logo.url);
        if (logoUrl) {
          try { cands.push({ url: new URL(logoUrl, baseUrl).toString(), prio: 100 }); } catch {}
        }
      }
    } catch {}
  }

  // 2. <img> mit "logo" in class/id/alt â€” meist das echte Header-Logo
  const imgRe = /<img[^>]+>/gi;
  let im;
  while ((im = imgRe.exec(html))) {
    const tag = im[0];
    const isLogo = /(?:class|id|alt)\s*=\s*["'][^"']*logo[^"']*["']/i.test(tag);
    if (!isLogo) continue;
    const srcMatch = tag.match(/(?:src|data-src)=["']([^"']+)["']/i);
    if (srcMatch) {
      try { cands.push({ url: new URL(srcMatch[1], baseUrl).toString(), prio: 80 }); } catch {}
    }
    // srcset (oft mehrere GrÃ¶ÃŸen â€” nimm die grÃ¶ÃŸte)
    const srcset = tag.match(/srcset=["']([^"']+)["']/i);
    if (srcset) {
      const last = srcset[1].split(",").pop()?.trim().split(/\s+/)[0];
      if (last) {
        try { cands.push({ url: new URL(last, baseUrl).toString(), prio: 85 }); } catch {}
      }
    }
  }

  // 3. Apple-Touch-Icon (meist 180Ã—180+)
  const apple = [...html.matchAll(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/gi)];
  for (const m of apple) {
    try { cands.push({ url: new URL(m[1], baseUrl).toString(), prio: 60 }); } catch {}
  }
  const apple2 = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon[^"']*["']/gi)];
  for (const m of apple2) {
    try { cands.push({ url: new URL(m[1], baseUrl).toString(), prio: 60 }); } catch {}
  }

  // 4. <link rel="icon"> mit groÃŸen sizes
  const iconRe = /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]*>/gi;
  let lm;
  while ((lm = iconRe.exec(html))) {
    const tag = lm[0];
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const sizesMatch = tag.match(/sizes=["'](\d+)/i);
    const size = sizesMatch ? parseInt(sizesMatch[1], 10) : 32;
    if (hrefMatch) {
      try {
        cands.push({
          url: new URL(hrefMatch[1], baseUrl).toString(),
          prio: size >= 192 ? 50 : size >= 96 ? 35 : size >= 64 ? 25 : 15,
        });
      } catch {}
    }
  }

  // 5. Standard /favicon.ico als Fallback
  try { cands.push({ url: new URL("/favicon.ico", baseUrl).toString(), prio: 5 }); } catch {}

  // Dedupe + sortieren
  const seen = new Set();
  return cands.sort((a, b) => b.prio - a.prio)
    .filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; })
    .map(c => c.url);
};

// LÃ¤dt eine URL mit Fallback-Versuchen herunter und gibt Buffer + Extension zurÃ¼ck
const downloadImage = async (urls, minSize = 100) => {
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Reelmind/1.0)" },
      });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < minSize) continue;
      const ct = r.headers.get("content-type") || "";
      const ext = ct.includes("png") ? "png"
                : ct.includes("webp") ? "webp"
                : ct.includes("svg") ? "svg"
                : ct.includes("gif") ? "gif"
                : ct.includes("x-icon") || ct.includes("vnd.microsoft.icon") ? "ico"
                : "jpg";
      return { buf, ext, url };
    } catch {}
  }
  return null;
};

app.post("/api/from-website", websiteUpload.single("logo"), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: "ANTHROPIC_API_KEY fehlt in .env" });

    let url = (req.body?.url || "").trim();
    if (!url) return res.status(400).json({ error: "URL ist Pflicht" });
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    console.log("[website] fetching:", url);
    let html = "";
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Reelmind/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      html = await r.text();
    } catch (e) {
      return res.status(400).json({ error: `Webseite konnte nicht geladen werden: ${e.message}` });
    }

    const text = htmlToText(html).slice(0, 30000);
    const heroImageUrl = findHeroImage(html, url);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "";

    let domainId = "kunde";
    try {
      domainId = new URL(url).hostname.replace(/^www\./, "").split(".")[0]
        .toLowerCase().replace(/[^a-z0-9-]/g, "-");
    } catch {}
    if (!domainId || domainId.length < 2) domainId = "kunde-" + crypto.randomBytes(3).toString("hex");
    let finalId = domainId, n = 2;
    while (existsSync(path.join(ROOT, "configs", `${finalId}.json`))) {
      finalId = `${domainId}-${n++}`;
    }

    const targetDir = path.join(ROOT, "public", finalId);
    await mkdir(targetDir, { recursive: true });

    let logoRelPath = null;
    if (req.file) {
      // 1. User-Upload hat Vorrang
      const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "") || "png";
      const fsp = await import("node:fs/promises");
      const dst = path.join(targetDir, `logo.${ext}`);
      await fsp.copyFile(req.file.path, dst);
      await fsp.unlink(req.file.path).catch(() => {});
      logoRelPath = `${finalId}/logo.${ext}`;
      console.log("[website] using uploaded logo");
    } else {
      // 2. Auto-Extraktion von der Webseite
      const logoUrls = findLogoUrls(html, url);
      console.log(`[website] trying to auto-extract logo from ${logoUrls.length} candidatesâ€¦`);
      const result = await downloadImage(logoUrls, 200);
      if (result) {
        const dst = path.join(targetDir, `logo.${result.ext}`);
        await writeFile(dst, result.buf);
        logoRelPath = `${finalId}/logo.${result.ext}`;
        console.log("[website] auto-extracted logo from:", result.url);
      } else {
        console.log("[website] no logo found on page");
      }
    }

    let heroRelPath = null;
    if (heroImageUrl) {
      try {
        const r = await fetch(heroImageUrl);
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          const ct = r.headers.get("content-type") || "";
          const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
          const dst = path.join(targetDir, `hero.${ext}`);
          await writeFile(dst, buf);
          heroRelPath = `${finalId}/hero.${ext}`;
        }
      } catch (e) {
        console.warn("[website] hero image fetch failed:", e.message);
      }
    }

    // Bilder als Base64 fÃ¼r Claude Vision laden (Logo + Hero)
    // ALLE Bilder werden via Sharp zu PNG normalisiert â€” SVG/ICO/WebP problemlos
    const fsp2 = await import("node:fs/promises");
    const imageBlocks = [];
    const tryAttachImage = async (relPath, label) => {
      if (!relPath) return;
      const fullPath = path.join(ROOT, "public", relPath);
      if (!existsSync(fullPath)) return;
      try {
        const rawBuf = await fsp2.readFile(fullPath);
        if (rawBuf.length === 0) return;
        // Konvertiere via Sharp zu PNG, max 1500Ã—1500 (Claude-API Limit), Alpha auf weiÃŸ flatten falls nÃ¶tig
        let pngBuf;
        try {
          pngBuf = await sharp(rawBuf)
            .resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .png({ compressionLevel: 6 })
            .toBuffer();
        } catch (e) {
          // Fallback fÃ¼r SVG: nur in PNG umwandeln ohne resize
          pngBuf = await sharp(rawBuf, { density: 200 }).png().toBuffer();
        }
        if (pngBuf.length > 5 * 1024 * 1024) {
          console.warn(`[website] ${label} too large after conversion (${pngBuf.length}b), skipping`);
          return;
        }
        imageBlocks.push({ type: "text", text: `\n[${label}:]` });
        imageBlocks.push({
          type: "image",
          source: { type: "base64", media_type: "image/png", data: pngBuf.toString("base64") },
        });
        console.log(`[website] attached ${label} (${(pngBuf.length / 1024).toFixed(0)}kb png)`);
      } catch (e) {
        console.warn(`[website] could not attach ${label}:`, e.message);
      }
    };
    await tryAttachImage(logoRelPath, "LOGO");
    await tryAttachImage(heroRelPath, "HERO-BILD VON DER WEBSEITE");

    const PROMPT = `Du bist ein Werbe-Profi und Brand-Designer. Analysiere die Webseite UND die mitgeschickten Bilder (Logo + Hero-Bild). Extrahiere alle fÃ¼r eine Werbeanzeige relevanten Inhalte. Gib EXAKT folgendes JSON zurÃ¼ck (NUR JSON, keine ErklÃ¤rung, kein Markdown):

{
  "id": "${finalId}",
  "unternehmen": { "name": "<Firmenname genau wie auf der Webseite>", "slogan": "<Slogan/Claim, leer wenn keiner>" },
  "headline": "<Hauptbotschaft. Wenn 2-zeilig, mit \\\\n trennen>",
  "subheadline": "<Untertitel oder beschreibender Satz, 1-2 SÃ¤tze max>",
  "vorteile": [
    { "titel": "<Vorteil 1, knapp>", "beschreibung": "<1-Zeiler>" },
    { "titel": "<Vorteil 2>", "beschreibung": "<...>" },
    { "titel": "<Vorteil 3>", "beschreibung": "<...>" }
  ],
  "cta": { "text": "<Call-to-Action z.B. 'Jetzt Termin'>", "kicker": "<kurzer Hinweis>" },
  "kontakt": {
    "adresse_zeile1": "<StraÃŸe + Nr.>",
    "adresse_zeile2": "<PLZ + Ort>",
    "telefon_buero": "<Haupttelefon>",
    "telefon_lager": "",
    "email": "<Email>",
    "website": "<Domain ohne https://>"
  },
  "oeffnungszeiten": { "mo_do": "", "fr": "", "hinweis": "" },
  "design": {
    "primary":   "<Hex der DOMINANTEN MARKENFARBE â€” schau dir Logo + Hero-Bild GENAU an>",
    "primaryLt": "<aufgehellte Variante davon>",
    "accent":    "<Hex der Akzent-/Action-Farbe â€” oft kontrastierend (Rot/Orange/Gold)>",
    "ink": "#0a0a0a", "white": "#ffffff",
    "fontHead": "Oswald", "fontBody": "Inter", "fontScript": "Caveat"
  }
}

WICHTIGE FARB-REGELN:
1. Schaue dir das LOGO an â€” nimm dessen dominante Farbe als "primary"
2. Wenn kein Logo da ist, schau ins HERO-BILD und identifiziere die Markenfarbe
3. Falls beide Bilder fehlen, identifiziere Farben aus dem Webseiten-Text (z.B. "wir setzen auf Blau" oder Hintergrund-CSS)
4. Gib EXAKTE Hex-Codes zurÃ¼ck â€” keine SchÃ¤tzungen wie "irgendein Blau", sondern z.B. "#1e3a8a"
5. "accent" muss zur Markenfarbe passen aber kontrastieren â€” bei Blau â†’ Rot/Orange, bei GrÃ¼n â†’ Gold, bei Schwarz â†’ Akzentfarbe aus dem Bild
6. Bei mehrfarbigen Logos: nimm die Farbe die am meisten FlÃ¤che einnimmt fÃ¼r "primary"

WICHTIG: Wenn etwas nicht erkennbar ist, leer lassen statt erfinden.

URL: ${url}
Titel: ${pageTitle}

WEBSEITEN-TEXT:
${text}`;

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();
    console.log(`[website] calling claude with ${imageBlocks.length / 2} image(s)â€¦`);
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          ...imageBlocks,
        ],
      }],
    });
    const respText = message.content.find((c) => c.type === "text")?.text ?? "";
    const jsonMatch = respText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude lieferte kein gÃ¼ltiges JSON zurÃ¼ck");
    const cfg = JSON.parse(jsonMatch[0]);

    cfg.id = finalId;
    cfg.assets = { logo: logoRelPath, hero: heroRelPath };
    cfg.variant = "a";
    cfg.vorteile_label = "Ihre Vorteile";
    cfg.duration = 15;
    cfg.fontPreset = "modern";
    if (cfg.kontakt) {
      cfg.kontakt.website = (cfg.kontakt.website || url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    }

    await writeFile(path.join(ROOT, "configs", `${finalId}.json`),
      JSON.stringify(cfg, null, 2));

    res.json({ id: finalId, config: cfg });
  } catch (e) {
    console.error("[website] error:", e);
    res.status(500).json({ error: e.message || "Webseiten-Analyse fehlgeschlagen" });
  }
});

// Trigger render â€” returns jobId
app.post("/api/render/:id", async (req, res) => {
  const id = req.params.id;
  const cfgPath = path.join(ROOT, "configs", `${id}.json`);
  if (!existsSync(cfgPath))
    return res.status(404).json({ error: "Config not found" });

  // Read format from config
  let format = "landscape";
  try {
    const cfg = JSON.parse(await readFile(cfgPath, "utf-8"));
    format = cfg.format || "landscape";
  } catch {}

  // Map format â†’ composition ID + output suffix
  const FORMAT_MAP = {
    landscape: { comp: "h",  suffix: "h"  },
    vertical:  { comp: "v",  suffix: "v"  },
    square:    { comp: "sq", suffix: "sq" },
    portrait:  { comp: "pt", suffix: "pt" },
  };
  const fm = FORMAT_MAP[format] || FORMAT_MAP.landscape;
  const compId = `${id}-cinematic-${fm.comp}`;
  const outFile = `${id}-cinematic-${fm.suffix}.mp4`;

  // Regenerate configs index so new uploads are picked up by Remotion
  await new Promise((resolve, reject) => {
    const p = spawn("node", ["scripts/generate-configs-index.mjs"], {
      cwd: ROOT, shell: true,
    });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("index gen failed"))));
  }).catch((e) => console.error(e));

  const jobId = crypto.randomBytes(6).toString("hex");
  jobs.set(jobId, {
    id, format, status: "rendering", progress: 0, total: 450,
    startedAt: Date.now(), error: null, log: [],
  });

  const proc = spawn("npx", [
    "remotion", "render", compId, `out/${outFile}`,
  ], { cwd: ROOT, shell: true });

  const job = jobs.get(jobId);
  proc.stdout.on("data", (d) => {
    const s = d.toString();
    job.log.push(s);
    if (job.log.length > 50) job.log.shift();
    // Match "Rendered N/M" or "Encoded N/M"
    const m = s.match(/(?:Rendered|Encoded)\s+(\d+)\s*\/\s*(\d+)/);
    if (m) {
      job.progress = parseInt(m[1], 10);
      job.total = parseInt(m[2], 10);
      job.phase = s.includes("Encoded") ? "encoding" : "rendering";
    }
  });
  proc.stderr.on("data", (d) => job.log.push(d.toString()));
  proc.on("close", (code) => {
    if (code === 0) {
      job.status = "done";
      job.progress = job.total;
    } else {
      job.status = "error";
      job.error = `Exit code ${code}`;
    }
    job.finishedAt = Date.now();
  });

  res.json({ jobId });
});

// Poll job status
app.get("/api/jobs/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.listen(PORT, () => {
  console.log(`âœ“ Server lÃ¤uft auf http://localhost:${PORT}`);
});


