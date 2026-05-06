# 🎬 Reelmind

> **Vom Werbeposter zum fertigen Werbespot — in unter 5 Minuten.**
> KI-gestützter Werbevideo-Generator mit 12 Premium-Animationsstilen.

![Made with Remotion](https://img.shields.io/badge/Made%20with-Remotion-FF6B6B)
![AI by Anthropic](https://img.shields.io/badge/AI-Claude%20Vision-D97706)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6)
![License](https://img.shields.io/badge/License-Proprietary-blue)

---

## 🎯 Was macht Reelmind?

Reelmind ist ein selbst-gehostetes Tool, das aus einem hochgeladenen **Werbeposter** automatisch ein professionelles **animiertes Werbevideo** erstellt. Perfekt für Außendienstler, Marketing-Agenturen und kleine Betriebe.

**Workflow:**
1. Poster per Drag & Drop hochladen
2. Claude Vision (KI) extrahiert automatisch Texte, Vorteile, Farben, Kontaktdaten
3. Daten prüfen / korrigieren im Web-Interface
4. Aus 12 Stil-Varianten + 5 Schriftpresets wählen
5. „Video erstellen" → in 3–5 Min fertig (Full HD, MP4)

---

## ✨ Features

### 🤖 KI-Power
- **Auto-Extraktion** via Claude Vision: erkennt Headline, Slogan, Vorteile, CTA, Adresse, Telefon, Markenfarben
- 1 Klick pro Poster — kein manuelles Abtippen mehr

### 🎨 12 Animationsstile (Cinematic-Tier)
| Variant | Beschreibung |
|---------|--------------|
| A — Letter Kinetic | Buchstabe-für-Buchstabe + Mega-Phone |
| B — Word Slide | Manifesto + Split-Card-Final |
| C — Zoom Burst | Stripes mit Riesenzahlen |
| D — Mask Wipe | Editorial mit Watermark-Numbers |
| E — Typewriter | TV-Broadcast Lower-Thirds |
| F — 3D Flip | Hexagon-Karten + Frame |
| G — Explosive Burst | Schockwellen + Sun-Rays |
| H — Liquid Flow | Morphing Blob-Shapes |
| I — Retro Synthwave | 80s Sun + Grid-Floor + Chrome-3D |
| J — Prism Holographic | Rainbow-Shimmer + Diamond-Karten |
| K — Motion Design | Bauhaus Geometrie + Strict-Grid |
| L — Cinema Noir | Letterbox + Lens-Flare |

### 📋 10 Branchen-Templates
Vorgefertigte Pakete (Variant + Farben + Schrift + Beispieltexte):
🔨 Handwerk · 🩺 Gesundheit · 🍽 Gastro · 🏠 Immobilien · 🚗 KFZ · 💇 Beauty · 💪 Fitness · 📚 Bildung · 🌳 Garten · 💼 Finanzen

### ⚙️ Vollständig anpassbar
- **5 Schriftpresets**: Modern · Bold · Elegant · Industrial · Editorial
- **3 Längen-Optionen**: 15s · 20s · 30s
- **Color-Picker** für Markenfarben (Primary + Accent)
- **Editierbares Formular** für alle Inhalte

### 💻 Modernes Web-Interface
- Drag-&-Drop Poster-Upload
- Live-Render-Progress mit Frame-Counter
- Video-Bibliothek aller erstellten Spots
- Glassmorphism-Design mit Tailwind CSS

### 🚀 Massenbetrieb
- Batch-Skripte: 50+ Kunden gleichzeitig extrahieren und rendern
- CLI für CI/CD-Integration

---

## 🛠 Tech Stack

- **[Remotion](https://remotion.dev)** — programmatische Video-Generation in React
- **[Claude Vision API](https://anthropic.com)** — KI-basierte Poster-Analyse
- **Express + Alpine.js** — leichtgewichtiges Web-Interface (kein Build-Step nötig)
- **Tailwind CSS** — modernes Design
- **TypeScript + React 19**
- **`@remotion/google-fonts`** — 8 Schriftarten

---

## 🚀 Installation

### Voraussetzungen
- Node.js ≥ 18
- [Anthropic API-Key](https://console.anthropic.com/settings/keys) (5 € Startguthaben gratis)

### Setup

```bash
# 1. Repo klonen
git clone https://github.com/donaldtagne/Reelmind.git
cd Reelmind

# 2. Dependencies installieren
npm install

# 3. API-Key konfigurieren
cp .env.example .env
# .env öffnen und ANTHROPIC_API_KEY einsetzen

# 4. Web-Server starten
npm run web
```

→ Öffne **http://localhost:3000** im Browser.

---

## 📖 Verwendung

### Web-Interface (für Außendienst & Endnutzer)

```bash
npm run web
```

Drag & Drop dein Poster, KI extrahiert die Inhalte, du wählst Stil → fertig.

### Per CLI (für Power-User & Automation)

```bash
# 1 Kunde: Poster ablegen + auto-extrahieren
npm run extract -- public/<id>/poster.png

# Video rendern (Cinematic Horizontal, Standard)
npm run render -- <id>

# Mit anderen Stilen
npm run render -- <id> --style classic
npm run render -- <id> --style neon
npm run render -- <id> --all          # alle Stile + Vertical

# Massenbetrieb: alle Kunden auf einmal
npm run extract-all
npm run render-all
```

### Remotion Studio (für Live-Vorschau)

```bash
npm start
```

→ Öffnet Remotion Studio mit allen registrierten Compositions zur Live-Vorschau.

---

## 📁 Projekt-Struktur

```
Reelmind/
├── configs/                    Pro Kunde 1 JSON-Datei
│   └── <kunden-id>.json
├── public/                     Statische Assets pro Kunde
│   └── <kunden-id>/
│       └── poster.png
├── out/                        Gerenderte MP4-Videos
│   └── <kunden-id>-cinematic-h.mp4
├── src/
│   ├── ads/
│   │   ├── types.ts            Config-Schema (TypeScript)
│   │   ├── fonts.ts            Font-Loader & Presets
│   │   ├── AdCinematic.tsx     12 Cinematic-Varianten
│   │   ├── AdHorizontal.tsx    Classic-Stil (Horizontal)
│   │   ├── AdVertical.tsx      Classic-Stil (Vertical)
│   │   ├── AdNeon.tsx          Neon-Glitch-Stil
│   │   └── configs.gen.ts      Auto-generierter Config-Index
│   └── Root.tsx                Remotion-Compositions-Registry
├── web/
│   ├── server.mjs              Express-Backend
│   └── public/
│       ├── index.html          Single-Page Web-UI (Alpine.js)
│       └── templates.js        10 Branchen-Templates
├── scripts/
│   ├── extract-poster.mjs      Einzel-Extraktion via Claude Vision
│   ├── batch-extract.mjs       Massen-Extraktion (parallel)
│   ├── render-ad.mjs           Einzel-Rendering
│   ├── render-all.mjs          Massen-Rendering
│   ├── reassign-variants.mjs   Variants gleichmäßig verteilen
│   └── generate-configs-index.mjs    Auto-Index für Remotion
└── .env                        API-Keys (NICHT committen!)
```

---

## 🎬 Beispiel-Workflow für 50 Kunden

```bash
# 1. 50 Poster in public/<id>/ ablegen (z.B. via Drag & Drop)
public/kunde-001/poster.png
public/kunde-002/poster.png
...

# 2. Massen-Extraktion via KI (parallel, ~3 Min für 50 Kunden)
npm run extract-all

# 3. Configs überfliegen, ggf. korrigieren

# 4. Massen-Rendering (sequentiell, läuft über Nacht)
npm run render-all

# → 50 fertige Werbevideos in out/
```

---

## 🎨 Schriftpresets im Detail

| Preset | Headline | Body | Wirkung |
|--------|----------|------|---------|
| Modern | Oswald | Inter | Clean, professionell |
| Bold | Anton | Lato | Kraftvoll, impact |
| Elegant | Playfair Display | Montserrat | Edel, klassisch |
| Industrial | Bebas Neue | Inter | Markant, technisch |
| Editorial | Playfair Display | Inter | Magazin-Stil |

---

## 🌍 Roadmap

- [ ] 🎵 Hintergrundmusik (Bibliothek + Upload)
- [ ] 📐 Multi-Format-Export (16:9 + 9:16 + 1:1 + 4:5 in 1 Klick)
- [ ] 💬 Animierte Untertitel/Captions (TikTok-Style)
- [ ] 🎙 KI-Voiceover (ElevenLabs-Integration)
- [ ] 🎬 Video-Clips als Hero (statt Standbild)
- [ ] 📤 Direct Social Share (Insta/TikTok/Facebook)
- [ ] 👥 Multi-User / Team-Accounts
- [ ] 📊 Analytics-Dashboard

---

## 📄 Lizenz

Proprietary — © 2026 Donald Tagne. Alle Rechte vorbehalten.

---

## 👤 Autor

**Donald Tagne**
- GitHub: [@donaldtagne](https://github.com/donaldtagne)

---

## 🤝 Beiträge

Pull-Requests sind willkommen für Bug-Fixes & Feature-Ergänzungen.
Bei größeren Änderungen bitte vorher ein Issue eröffnen.
