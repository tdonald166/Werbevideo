import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as caveat } from "@remotion/google-fonts/Caveat";
import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as lato } from "@remotion/google-fonts/Lato";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as cinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as outfit } from "@remotion/google-fonts/Outfit";
import { loadFont as cormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as archivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as audiowide } from "@remotion/google-fonts/Audiowide";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as dmSans } from "@remotion/google-fonts/DMSans";
import { loadFont as lora } from "@remotion/google-fonts/Lora";
import { loadFont as kanit } from "@remotion/google-fonts/Kanit";
import { loadFont as righteous } from "@remotion/google-fonts/Righteous";

const map: Record<string, () => { fontFamily: string }> = {
  Oswald: oswald,
  Inter: inter,
  Caveat: caveat,
  Anton: anton,
  Lato: lato,
  PlayfairDisplay: playfair,
  BebasNeue: bebas,
  Montserrat: montserrat,
  Cinzel: cinzel,
  Outfit: outfit,
  CormorantGaramond: cormorant,
  ArchivoBlack: archivoBlack,
  Audiowide: audiowide,
  Manrope: manrope,
  DMSans: dmSans,
  Lora: lora,
  Kanit: kanit,
  Righteous: righteous,
};

export const font = (name: string): string => {
  const loader = map[name] ?? map.Inter;
  return loader().fontFamily;
};

// Erweiterte Font-Presets — 12 Stilrichtungen
export const FONT_PRESETS: Record<string, { head: string; body: string; script: string }> = {
  modern:     { head: "Oswald",            body: "Inter",      script: "Caveat" },
  bold:       { head: "Anton",             body: "Lato",       script: "Caveat" },
  elegant:    { head: "PlayfairDisplay",   body: "Montserrat", script: "Caveat" },
  industrial: { head: "BebasNeue",         body: "Inter",      script: "Caveat" },
  editorial:  { head: "PlayfairDisplay",   body: "Inter",      script: "Caveat" },
  luxury:     { head: "Cinzel",            body: "Outfit",     script: "Caveat" },
  premium:    { head: "CormorantGaramond", body: "Outfit",     script: "Caveat" },
  tech:       { head: "Outfit",            body: "DMSans",     script: "Caveat" },
  heavy:      { head: "ArchivoBlack",      body: "Inter",      script: "Caveat" },
  futuristic: { head: "Audiowide",         body: "Manrope",    script: "Caveat" },
  refined:    { head: "Manrope",           body: "Lora",       script: "Caveat" },
  power:      { head: "Kanit",             body: "Inter",      script: "Caveat" },
  retro:      { head: "Righteous",         body: "DMSans",     script: "Caveat" },
};

export const getPreset = (name?: string) =>
  FONT_PRESETS[name ?? "modern"] ?? FONT_PRESETS.modern;
