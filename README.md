# ðŸŽ¬ Reelmind

> **Vom Werbeposter zum fertigen Werbespot â€” in unter 5 Minuten.**
> KI-gestÃ¼tzter Werbevideo-Generator mit 12 Premium-Animationsstilen.

![Made with Remotion](https://img.shields.io/badge/Made%20with-Remotion-FF6B6B)
![AI by Anthropic](https://img.shields.io/badge/AI-Claude%20Vision-D97706)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6)
![License](https://img.shields.io/badge/License-Proprietary-blue)

---

## ðŸŽ¯ Was macht Reelmind?

Reelmind ist ein selbst-gehostetes Tool, das aus einem hochgeladenen **Werbeposter** automatisch ein professionelles **animiertes Werbevideo** erstellt. Perfekt fÃ¼r AuÃŸendienstler, Marketing-Agenturen und kleine Betriebe.

**Workflow:**
1. Poster per Drag & Drop hochladen
2. Claude Vision (KI) extrahiert automatisch Texte, Vorteile, Farben, Kontaktdaten
3. Daten prÃ¼fen / korrigieren im Web-Interface
4. Aus 12 Stil-Varianten + 5 Schriftpresets wÃ¤hlen
5. â€žVideo erstellen" â†’ in 3â€“5 Min fertig (Full HD, MP4)

---

## âœ¨ Features

### ðŸ¤– KI-Power
- **Auto-Extraktion** via Claude Vision: erkennt Headline, Slogan, Vorteile, CTA, Adresse, Telefon, Markenfarben
- 1 Klick pro Poster â€” kein manuelles Abtippen mehr

### ðŸŽ¨ 12 Animationsstile (Cinematic-Tier)
| Variant | Beschreibung |
|---------|--------------|
| A â€” Letter Kinetic | Buchstabe-fÃ¼r-Buchstabe + Mega-Phone |
| B â€” Word Slide | Manifesto + Split-Card-Final |
| C â€” Zoom Burst | Stripes mit Riesenzahlen |
| D â€” Mask Wipe | Editorial mit Watermark-Numbers |
| E â€” Typewriter | TV-Broadcast Lower-Thirds |
| F â€” 3D Flip | Hexagon-Karten + Frame |
| G â€” Explosive Burst | Schockwellen + Sun-Rays |
| H â€” Liquid Flow | Morphing Blob-Shapes |
| I â€” Retro Synthwave | 80s Sun + Grid-Floor + Chrome-3D |
| J â€” Prism Holographic | Rainbow-Shimmer + Diamond-Karten |
| K â€” Motion Design | Bauhaus Geometrie + Strict-Grid |
| L â€” Cinema Noir | Letterbox + Lens-Flare |

### ðŸ“‹ 10 Branchen-Templates
Vorgefertigte Pakete (Variant + Farben + Schrift + Beispieltexte):
ðŸ”¨ Handwerk Â· ðŸ©º Gesundheit Â· ðŸ½ Gastro Â· ðŸ  Immobilien Â· ðŸš— KFZ Â· ðŸ’‡ Beauty Â· ðŸ’ª Fitness Â· ðŸ“š Bildung Â· ðŸŒ³ Garten Â· ðŸ’¼ Finanzen

### âš™ï¸ VollstÃ¤ndig anpassbar
- **5 Schriftpresets**: Modern Â· Bold Â· Elegant Â· Industrial Â· Editorial
- **3 LÃ¤ngen-Optionen**: 15s Â· 20s Â· 30s
- **Color-Picker** fÃ¼r Markenfarben (Primary + Accent)
- **Editierbares Formular** fÃ¼r alle Inhalte

### ðŸ’» Modernes Web-Interface
- Drag-&-Drop Poster-Upload
- Live-Render-Progress mit Frame-Counter
- Video-Bibliothek aller erstellten Spots
- Glassmorphism-Design mit Tailwind CSS

### ðŸš€ Massenbetrieb
- Batch-Skripte: 50+ Kunden gleichzeitig extrahieren und rendern
- CLI fÃ¼r CI/CD-Integration

---

## ðŸ›  Tech Stack

- **[Remotion](https://remotion.dev)** â€” programmatische Video-Generation in React
- **[Claude Vision API](https://anthropic.com)** â€” KI-basierte Poster-Analyse
- **Express + Alpine.js** â€” leichtgewichtiges Web-Interface (kein Build-Step nÃ¶tig)
- **Tailwind CSS** â€” modernes Design
- **TypeScript + React 19**
- **`@remotion/google-fonts`** â€” 8 Schriftarten

---

## ðŸš€ Installation

### Voraussetzungen
- Node.js â‰¥ 18
- [Anthropic API-Key](https://console.anthropic.com/settings/keys) (5 â‚¬ Startguthaben gratis)

### Setup

```bash
# 1. Repo klonen
git clone https://github.com/donaldtagne/Reelmind.git
cd Reelmind

# 2. Dependencies installieren
npm install

# 3. API-Key konfigurieren
cp .env.example .env
# .env Ã¶ffnen und ANTHROPIC_API_KEY einsetzen

# 4. Web-Server starten
npm run web
```

â†’ Ã–ffne **http://localhost:8080** im Browser.

---

## ðŸ“– Verwendung

### Web-Interface (fÃ¼r AuÃŸendienst & Endnutzer)

```bash
npm run web
```

Drag & Drop dein Poster, KI extrahiert die Inhalte, du wÃ¤hlst Stil â†’ fertig.

### Per CLI (fÃ¼r Power-User & Automation)

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

### Remotion Studio (fÃ¼r Live-Vorschau)

```bash
npm start
```

â†’ Ã–ffnet Remotion Studio mit allen registrierten Compositions zur Live-Vorschau.

---

## ðŸ“ Projekt-Struktur

```
Reelmind/
â”œâ”€â”€ configs/                    Pro Kunde 1 JSON-Datei
â”‚   â””â”€â”€ <kunden-id>.json
â”œâ”€â”€ public/                     Statische Assets pro Kunde
â”‚   â””â”€â”€ <kunden-id>/
â”‚       â””â”€â”€ poster.png
â”œâ”€â”€ out/                        Gerenderte MP4-Videos
â”‚   â””â”€â”€ <kunden-id>-cinematic-h.mp4
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ ads/
â”‚   â”‚   â”œâ”€â”€ types.ts            Config-Schema (TypeScript)
â”‚   â”‚   â”œâ”€â”€ fonts.ts            Font-Loader & Presets
â”‚   â”‚   â”œâ”€â”€ AdCinematic.tsx     12 Cinematic-Varianten
â”‚   â”‚   â”œâ”€â”€ AdHorizontal.tsx    Classic-Stil (Horizontal)
â”‚   â”‚   â”œâ”€â”€ AdVertical.tsx      Classic-Stil (Vertical)
â”‚   â”‚   â”œâ”€â”€ AdNeon.tsx          Neon-Glitch-Stil
â”‚   â”‚   â””â”€â”€ configs.gen.ts      Auto-generierter Config-Index
â”‚   â””â”€â”€ Root.tsx                Remotion-Compositions-Registry
â”œâ”€â”€ web/
â”‚   â”œâ”€â”€ server.mjs              Express-Backend
â”‚   â””â”€â”€ public/
â”‚       â”œâ”€â”€ index.html          Single-Page Web-UI (Alpine.js)
â”‚       â””â”€â”€ templates.js        10 Branchen-Templates
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ extract-poster.mjs      Einzel-Extraktion via Claude Vision
â”‚   â”œâ”€â”€ batch-extract.mjs       Massen-Extraktion (parallel)
â”‚   â”œâ”€â”€ render-ad.mjs           Einzel-Rendering
â”‚   â”œâ”€â”€ render-all.mjs          Massen-Rendering
â”‚   â”œâ”€â”€ reassign-variants.mjs   Variants gleichmÃ¤ÃŸig verteilen
â”‚   â””â”€â”€ generate-configs-index.mjs    Auto-Index fÃ¼r Remotion
â””â”€â”€ .env                        API-Keys (NICHT committen!)
```

---

## ðŸŽ¬ Beispiel-Workflow fÃ¼r 50 Kunden

```bash
# 1. 50 Poster in public/<id>/ ablegen (z.B. via Drag & Drop)
public/kunde-001/poster.png
public/kunde-002/poster.png
...

# 2. Massen-Extraktion via KI (parallel, ~3 Min fÃ¼r 50 Kunden)
npm run extract-all

# 3. Configs Ã¼berfliegen, ggf. korrigieren

# 4. Massen-Rendering (sequentiell, lÃ¤uft Ã¼ber Nacht)
npm run render-all

# â†’ 50 fertige Werbevideos in out/
```

---

## ðŸŽ¨ Schriftpresets im Detail

| Preset | Headline | Body | Wirkung |
|--------|----------|------|---------|
| Modern | Oswald | Inter | Clean, professionell |
| Bold | Anton | Lato | Kraftvoll, impact |
| Elegant | Playfair Display | Montserrat | Edel, klassisch |
| Industrial | Bebas Neue | Inter | Markant, technisch |
| Editorial | Playfair Display | Inter | Magazin-Stil |

---

## ðŸŒ Roadmap

- [ ] ðŸŽµ Hintergrundmusik (Bibliothek + Upload)
- [ ] ðŸ“ Multi-Format-Export (16:9 + 9:16 + 1:1 + 4:5 in 1 Klick)
- [ ] ðŸ’¬ Animierte Untertitel/Captions (TikTok-Style)
- [ ] ðŸŽ™ KI-Voiceover (ElevenLabs-Integration)
- [ ] ðŸŽ¬ Video-Clips als Hero (statt Standbild)
- [ ] ðŸ“¤ Direct Social Share (Insta/TikTok/Facebook)
- [ ] ðŸ‘¥ Multi-User / Team-Accounts
- [ ] ðŸ“Š Analytics-Dashboard

---

## ðŸ“„ Lizenz

Proprietary â€” Â© 2026 Donald Tagne. Alle Rechte vorbehalten.

---

## ðŸ‘¤ Autor

**Donald Tagne**
- GitHub: [@donaldtagne](https://github.com/donaldtagne)

---

## ðŸ¤ BeitrÃ¤ge

Pull-Requests sind willkommen fÃ¼r Bug-Fixes & Feature-ErgÃ¤nzungen.
Bei grÃ¶ÃŸeren Ã„nderungen bitte vorher ein Issue erÃ¶ffnen.

