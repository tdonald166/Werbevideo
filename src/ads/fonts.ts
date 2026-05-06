import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as caveat } from "@remotion/google-fonts/Caveat";
import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as lato } from "@remotion/google-fonts/Lato";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";

const map: Record<string, () => { fontFamily: string }> = {
  Oswald: oswald,
  Inter: inter,
  Caveat: caveat,
  Anton: anton,
  Lato: lato,
  PlayfairDisplay: playfair,
  BebasNeue: bebas,
  Montserrat: montserrat,
};

export const font = (name: string): string => {
  const loader = map[name] ?? map.Inter;
  return loader().fontFamily;
};

// Font-Presets: bündeln passende Schriften für Head/Body/Script
export const FONT_PRESETS: Record<string, { head: string; body: string; script: string }> = {
  modern:     { head: "Oswald",          body: "Inter",      script: "Caveat" },
  bold:       { head: "Anton",           body: "Lato",       script: "Caveat" },
  elegant:    { head: "PlayfairDisplay", body: "Montserrat", script: "Caveat" },
  industrial: { head: "BebasNeue",       body: "Inter",      script: "Caveat" },
  editorial:  { head: "PlayfairDisplay", body: "Inter",      script: "Caveat" },
};

// Holt einen Preset (oder fällt auf Modern zurück)
export const getPreset = (name?: string) =>
  FONT_PRESETS[name ?? "modern"] ?? FONT_PRESETS.modern;
