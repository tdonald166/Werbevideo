// Web-UI Server für Werbevideo-Generator
//   Start:   npm run web
//   URL:     http://localhost:3000

import "dotenv/config";
import express from "express";
import multer from "multer";
import { spawn } from "node:child_process";
import { existsSync, createReadStream } from "node:fs";
import { readFile, writeFile, mkdir, readdir, stat, rename } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(path.join(ROOT, "out")));
app.use("/posters", express.static(path.join(ROOT, "public")));

// In-memory job tracking
const jobs = new Map(); // jobId → { id, status, progress, total, startedAt, error }

// ── Multer upload to temp folder ──
const upload = multer({
  dest: path.join(ROOT, "tmp-uploads"),
  limits: { fileSize: 30 * 1024 * 1024 },
});

// ── Routes ──
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
      const videoFile = `${id}-cinematic-h.mp4`;
      const videoPath = path.join(ROOT, "out", videoFile);
      const hasVideo = existsSync(videoPath);
      const videoMtime = hasVideo ? (await stat(videoPath)).mtimeMs : 0;
      return {
        id,
        name: cfg.unternehmen?.name || id,
        slogan: cfg.unternehmen?.slogan || "",
        variant: cfg.variant || "a",
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
    const videoFile = path.join(ROOT, "out", `${id}-cinematic-h.mp4`);
    const fs = await import("node:fs/promises");
    if (existsSync(cfgPath)) await fs.unlink(cfgPath);
    if (existsSync(videoFile)) await fs.unlink(videoFile);
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

// Trigger render — returns jobId
app.post("/api/render/:id", async (req, res) => {
  const id = req.params.id;
  if (!existsSync(path.join(ROOT, "configs", `${id}.json`)))
    return res.status(404).json({ error: "Config not found" });

  // Regenerate configs index so new uploads are picked up by Remotion
  await new Promise((resolve, reject) => {
    const p = spawn("node", ["scripts/generate-configs-index.mjs"], {
      cwd: ROOT, shell: true,
    });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("index gen failed"))));
  }).catch((e) => console.error(e));

  const jobId = crypto.randomBytes(6).toString("hex");
  jobs.set(jobId, {
    id, status: "rendering", progress: 0, total: 450,
    startedAt: Date.now(), error: null, log: [],
  });

  const proc = spawn("npx", [
    "remotion", "render", `${id}-cinematic-h`, `out/${id}-cinematic-h.mp4`,
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
  console.log(`✓ Server läuft auf http://localhost:${PORT}`);
});
