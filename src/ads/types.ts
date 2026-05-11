export type AdConfig = {
  id: string;
  unternehmen: { name: string; slogan: string };
  headline: string;
  subheadline: string;
  vorteile: { titel: string; beschreibung: string }[];
  cta: { text: string; kicker: string };
  kontakt: {
    adresse_zeile1: string;
    adresse_zeile2: string;
    telefon_buero: string;
    telefon_lager?: string;
    email: string;
    website: string;
  };
  oeffnungszeiten: { mo_do: string; fr: string; hinweis?: string };
  design: {
    primary: string;
    primaryLt: string;
    accent: string;
    ink: string;
    white: string;
    fontHead: string;
    fontBody: string;
    fontScript: string;
  };
  assets: { logo: string | null; hero: string | null; hero2?: string | null };
  variant?: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t";
  vorteile_label?: string;
  duration?: number;          // Dauer in Sekunden (15, 20, 30) — Default 15
  fontPreset?: string;        // "modern" | "bold" | "elegant" | "industrial" | "editorial"
  textAnimation?: string;     // "kinetic" | "typewriter" | "wave" | "fade" | "slide" | "bounce" | "zoom" | "glitch" | "wordstack" | "wipe"
  format?: string;            // "landscape" (16:9) | "vertical" (9:16) | "square" (1:1) | "portrait" (4:5)
};
