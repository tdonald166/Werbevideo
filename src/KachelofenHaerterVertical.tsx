import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  random,
  Img,
  staticFile,
} from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: ANTON } = loadAnton();
const { fontFamily: LATO }  = loadLato();
const { fontFamily: PLAYFAIR } = loadPlayfair();

// ─── Brand colors ─────────────────────────────────────────
const BLACK   = "#0a0a0a";
const GOLD    = "#d4af37";
const GOLD_HI = "#f5d56e";
const RED     = "#c41e1e";
const WHITE   = "#ffffff";
const EMBER   = "#ff7a18";

// ─── Easing ───────────────────────────────────────────────
const EO  = Easing.bezier(0.16, 1, 0.3, 1);
const EIN = Easing.bezier(0.55, 0, 1, 0.45);
const EI  = Easing.bezier(0.45, 0, 0.55, 1);
const POP = Easing.bezier(0.34, 1.56, 0.64, 1);

const ci = (
  f: number,
  range: [number, number],
  out: [number, number],
  ease = EI,
) =>
  interpolate(f, range, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

// ─── Floating embers ──────────────────────────────────────
const Embers = ({ frame }: { frame: number }) => {
  const PARTICLES = 32;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const seed = i + 1;
        const startX  = random(`x-${seed}`) * 1080;
        const speed   = 0.7 + random(`s-${seed}`) * 1.3;
        const drift   = (random(`d-${seed}`) - 0.5) * 180;
        const size    = 2 + random(`r-${seed}`) * 5;
        const phase   = random(`p-${seed}`) * 200;
        const lifeY   = ((frame * speed + phase) % 2100) - 100;
        const yPos    = 1920 - lifeY;
        const xPos    = startX + Math.sin((frame + phase) * 0.04) * drift;
        const op      = Math.sin((lifeY / 2100) * Math.PI) * 0.7;
        return (
          <div key={i} style={{
            position: "absolute",
            left: xPos, top: yPos,
            width: size, height: size,
            borderRadius: "50%",
            background: i % 3 === 0 ? GOLD_HI : EMBER,
            boxShadow: `0 0 ${size * 3}px ${EMBER}`,
            opacity: op,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Logo block ───────────────────────────────────────────
const Logo: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div style={{
    background: "rgba(232,115,28,0.95)",
    padding: "10px 22px",
    borderRadius: 8,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    transform: `scale(${scale})`,
    display: "inline-block",
  }}>
    <Img src={staticFile("image.png")} style={{
      height: 70, width: "auto", display: "block",
    }} />
  </div>
);

// ─── SCENE 1 — Hook (0–3.5 s) ─────────────────────────────
const SceneHook = ({ frame }: { frame: number }) => {
  const START = 0, END = 105;
  if (frame >= END) return null;

  const flicker = 1 + Math.sin(frame * 0.4) * 0.05 + Math.sin(frame * 1.1) * 0.02;
  const glowPulse = 60 + Math.sin(frame * 0.25) * 30;

  const logoOp = ci(frame, [0, 18], [0, 1], EO);
  const logoY  = ci(frame, [0, 22], [-30, 0], EO);

  const titleOp = ci(frame, [10, 30], [0, 1], EO);
  const titleY  = ci(frame, [10, 32], [40, 0], EO);
  const subOp   = ci(frame, [26, 46], [0, 1], EO);
  const subY    = ci(frame, [26, 46], [30, 0], EO);

  const imgOp = ci(frame, [18, 40], [0, 1], EO);
  const imgSc = ci(frame, [18, 50], [0.92, 1], EO);

  const badgeOp = ci(frame, [34, 54], [0, 1], EO);
  const badgeSc = ci(frame, [34, 60], [0, 1], POP);

  const exit = ci(frame, [END - 18, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 60%, #2a1a0a 0%, ${BLACK} 70%)`,
      opacity: exit,
    }}>
      {/* Glow halo */}
      <div style={{
        position: "absolute",
        left: "50%", top: "55%",
        width: 1200, height: 1200,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background: `radial-gradient(circle, ${EMBER}55 0%, transparent 60%)`,
        filter: `blur(${50 * flicker}px)`,
        opacity: 0.85 * flicker,
      }} />

      <Embers frame={frame} />

      {/* Logo top */}
      <div style={{
        position: "absolute",
        top: 80, left: "50%",
        transform: `translateX(-50%) translateY(${logoY}px)`,
        opacity: logoOp,
      }}>
        <Logo />
      </div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: 250, left: 0, right: 0,
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{
          fontFamily: ANTON,
          fontSize: 130,
          color: WHITE, lineHeight: 0.95,
          letterSpacing: 2,
          textShadow: `0 0 ${glowPulse}px ${EMBER}aa, 0 6px 30px rgba(0,0,0,0.6)`,
        }}>
          FEUER &<br />WÄRME
        </div>
        <div style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontFamily: ANTON,
          fontSize: 76,
          background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD} 50%, #a8842a 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 2, marginTop: 12,
          filter: `drop-shadow(0 4px 16px ${GOLD}66)`,
        }}>
          ZUM WOHLFÜHLEN?
        </div>
      </div>

      {/* Big fireplace photo */}
      <div style={{
        position: "absolute",
        top: 820, left: "50%",
        width: 820, height: 820,
        transform: `translateX(-50%) scale(${imgSc})`,
        opacity: imgOp,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: `0 30px 100px ${EMBER}77, 0 0 0 3px ${GOLD}`,
      }}>
        <Img src={staticFile("kamine.webp")} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${ci(frame, [0, 105], [1.0, 1.1], EI)})`,
          transformOrigin: "center 60%",
          filter: `brightness(${1 + (flicker - 1) * 0.5}) saturate(1.2)`,
        }} />
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.45) 100%)`,
        }} />
      </div>

      {/* 20 Jahre badge */}
      <div style={{
        position: "absolute",
        top: 760, right: 60,
        opacity: badgeOp,
        transform: `scale(${badgeSc}) rotate(-10deg)`,
        width: 240, height: 240,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${GOLD_HI} 0%, ${GOLD} 60%, #8a6a1a 100%)`,
        boxShadow: `0 0 60px ${GOLD}aa, inset 0 0 40px rgba(0,0,0,0.3)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: ANTON, color: BLACK, textAlign: "center",
      }}>
        <div style={{ fontSize: 22, letterSpacing: 2 }}>ÜBER</div>
        <div style={{ fontSize: 88, lineHeight: 0.9 }}>20</div>
        <div style={{ fontSize: 22, letterSpacing: 1 }}>JAHRE</div>
        <div style={{ fontSize: 14, fontFamily: LATO, fontWeight: 700, letterSpacing: 1 }}>
          ERFAHRUNG
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — Werte (3.5–7 s) ────────────────────────────
const VALUES = [
  { title: "INDIVIDUELL",  desc: "Maßgeschneidert für Ihr Zuhause." },
  { title: "MEISTERHAFT",  desc: "Erfahrung. Präzision. Qualität." },
  { title: "NACHHALTIG",   desc: "Effiziente Technologie für die Zukunft." },
];

const SceneValues = ({ frame }: { frame: number }) => {
  const START = 105, END = 210;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, #1a1410 0%, ${BLACK} 75%)`,
      opacity: bgOp * exit,
    }}>
      <Embers frame={frame} />

      {/* Header */}
      <div style={{
        position: "absolute",
        top: 200, left: 0, right: 0,
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translateY(${ci(f, [4, 24], [40, 0], EO)}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: ANTON, fontSize: 88,
          color: WHITE, letterSpacing: 3, lineHeight: 1,
        }}>
          UNSERE
        </div>
        <div style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700,
          fontSize: 96, color: GOLD, lineHeight: 1,
          marginTop: 4,
          textShadow: `0 4px 24px ${GOLD}66`,
        }}>
          Versprechen
        </div>
        <div style={{
          width: 100, height: 4,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          margin: "30px auto 0",
        }} />
      </div>

      {/* 3 values stacked */}
      <div style={{
        position: "absolute",
        top: 680, left: 0, right: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 50,
        padding: "0 60px",
      }}>
        {VALUES.map((v, i) => {
          const sStart = 24 + i * 16;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const tx = ci(f, [sStart, sStart + 26], [-80, 0], EO);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${tx}px)`,
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: ANTON, fontSize: 100,
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD} 60%, #8a6a1a 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 4, lineHeight: 1,
                filter: `drop-shadow(0 4px 16px ${GOLD}66)`,
              }}>
                {v.title}
              </div>
              <div style={{
                fontFamily: LATO, fontWeight: 400,
                fontSize: 32, color: "rgba(255,255,255,0.85)",
                marginTop: 6,
              }}>
                {v.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — Services (7–11 s) ──────────────────────────
const SERVICES = [
  { title: "KACHELÖFEN",          desc: "Individuelle Wärmequellen." },
  { title: "HEIZKAMINE",          desc: "Sichtbare Designwärme." },
  { title: "KAMIN- & PELLETÖFEN", desc: "Moderne Lösungen." },
  { title: "PLANUNG & BERATUNG",  desc: "Alles aus einer Hand." },
];

const SceneServices = ({ frame }: { frame: number }) => {
  const START = 210, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, #2a1a0a 0%, ${BLACK} 75%)`,
      opacity: bgOp * exit,
    }}>
      {/* Background fireplace photo, blurred */}
      <AbsoluteFill style={{ opacity: 0.18 }}>
        <Img src={staticFile("kamine1.webp")} style={{
          width: "100%", height: "100%", objectFit: "cover",
          filter: "blur(10px) brightness(0.6) saturate(1.2)",
          transform: `scale(${ci(f, [0, 120], [1.0, 1.1], EI)})`,
        }} />
      </AbsoluteFill>

      <Embers frame={frame} />

      {/* Gold banner top */}
      <div style={{
        position: "absolute",
        top: 140, left: "50%",
        transform: `translateX(-50%) translateY(${ci(f, [4, 24], [-40, 0], EO)}px)`,
        opacity: ci(f, [4, 22], [0, 1], EO),
        padding: "20px 60px",
        background: `linear-gradient(90deg, ${GOLD_HI} 0%, ${GOLD} 50%, #8a6a1a 100%)`,
        borderRadius: 6,
        fontFamily: ANTON, fontSize: 52,
        color: BLACK, letterSpacing: 2,
        boxShadow: `0 0 50px ${GOLD}88`,
        whiteSpace: "nowrap",
      }}>
        KACHELÖFEN HÄRTER
      </div>

      <div style={{
        position: "absolute",
        top: 250, left: 0, right: 0,
        opacity: ci(f, [10, 28], [0, 1], EO),
        fontFamily: LATO, fontWeight: 700,
        fontSize: 22, color: GOLD, textAlign: "center",
        letterSpacing: 3,
      }}>
        MEISTERBETRIEB · SEIT 20 JAHREN
      </div>

      {/* 4 service cards in 2×2 grid */}
      <div style={{
        position: "absolute",
        top: 380, left: 60, right: 60, bottom: 100,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 30,
      }}>
        {SERVICES.map((s, i) => {
          const sStart = 22 + i * 12;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 26], [60, 0], EO);
          const sc = ci(f, [sStart, sStart + 28], [0.85, 1], POP);
          const glow = 14 + Math.sin((f - sStart) * 0.15) * 6;
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              padding: "40px 24px",
              border: `2px solid ${GOLD}66`,
              borderRadius: 14,
              background: "rgba(20,15,8,0.6)",
              boxShadow: `0 0 ${glow}px ${GOLD}33, inset 0 0 30px rgba(212,175,55,0.06)`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: ANTON, fontSize: 38,
                color: WHITE, letterSpacing: 1,
                lineHeight: 1.1, marginBottom: 14,
              }}>
                {s.title}
              </div>
              <div style={{
                fontFamily: LATO, fontWeight: 400,
                fontSize: 20, color: "rgba(255,255,255,0.8)",
                lineHeight: 1.4,
              }}>
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — CTA (11–15 s) ──────────────────────────────
const SceneCTA = ({ frame }: { frame: number }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);

  const headOp = ci(f, [6, 26], [0, 1], EO);
  const headY  = ci(f, [6, 28], [40, 0], EO);

  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const phoneSc = ci(f, [22, 50], [0.6, 1], POP);

  const addrOp = ci(f, [44, 62], [0, 1], EO);
  const addrY  = ci(f, [44, 62], [20, 0], EO);

  const sloganOp = ci(f, [60, 80], [0, 1], EO);
  const logoOp   = ci(f, [0, 20], [0, 1], EO);

  const glow = 30 + Math.sin(f * 0.18) * 18;
  const phonePulse = 1 + Math.sin(f * 0.18) * 0.025;

  const fade = ci(f, [END - START - 12, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, ${BLACK} 0%, #2a0808 50%, ${BLACK} 100%)`,
      opacity: bgOp * fade,
    }}>
      {/* Background fireplace photo */}
      <AbsoluteFill style={{ opacity: 0.22 }}>
        <Img src={staticFile("kamine.webp")} style={{
          width: "100%", height: "100%", objectFit: "cover",
          filter: "blur(8px) brightness(0.5) saturate(1.3)",
          transform: `scale(${ci(f, [0, 120], [1.0, 1.15], EI)})`,
        }} />
      </AbsoluteFill>

      <Embers frame={frame} />

      {/* Logo top */}
      <div style={{
        position: "absolute",
        top: 80, left: "50%",
        transform: "translateX(-50%)",
        opacity: logoOp,
      }}>
        <Logo />
      </div>

      {/* Headline */}
      <div style={{
        position: "absolute",
        top: 280, left: 0, right: 0,
        opacity: headOp,
        transform: `translateY(${headY}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: ANTON, fontSize: 110,
          color: WHITE, lineHeight: 0.95,
          letterSpacing: 3,
          textShadow: "0 6px 30px rgba(0,0,0,0.6)",
        }}>
          JETZT
        </div>
        <div style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700,
          fontSize: 76, color: GOLD,
          marginTop: 4, lineHeight: 1,
          textShadow: `0 4px 20px ${GOLD}55`,
        }}>
          beraten lassen!
        </div>
      </div>

      {/* Phone — big, pulsing */}
      <div style={{
        position: "absolute",
        top: 700, left: "50%",
        opacity: phoneOp,
        transform: `translateX(-50%) scale(${phoneSc * phonePulse})`,
        padding: "30px 50px",
        background: "rgba(0,0,0,0.55)",
        border: `3px solid ${GOLD}`,
        borderRadius: 20,
        boxShadow: `0 0 ${glow}px ${GOLD}aa, inset 0 0 30px rgba(212,175,55,0.1)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: LATO, fontWeight: 700,
          fontSize: 24, color: GOLD,
          letterSpacing: 4, marginBottom: 6,
        }}>
          ANRUFEN
        </div>
        <div style={{
          fontFamily: ANTON, fontSize: 110,
          color: WHITE, letterSpacing: 4, lineHeight: 1,
          textShadow: `0 0 24px ${GOLD}aa`,
        }}>
          06728-753
        </div>
      </div>

      {/* Address */}
      <div style={{
        position: "absolute",
        top: 1080, left: 0, right: 0,
        opacity: addrOp,
        transform: `translateY(${addrY}px)`,
        textAlign: "center",
        fontFamily: LATO, fontWeight: 400,
        fontSize: 28, color: "rgba(255,255,255,0.92)",
        lineHeight: 1.5,
      }}>
        Kapellenstraße 32<br />
        55437 Nieder-Hilbersheim
      </div>

      {/* Slogan */}
      <div style={{
        position: "absolute",
        bottom: 240, left: 0, right: 0,
        opacity: sloganOp,
        textAlign: "center",
        padding: "0 40px",
      }}>
        <div style={{
          fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700,
          fontSize: 50, color: WHITE,
          lineHeight: 1.2,
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          Wir machen aus<br />
          <span style={{ color: EMBER }}>Feuer</span> ein Zuhause.
        </div>
      </div>

      {/* Web */}
      <div style={{
        position: "absolute",
        bottom: 100, left: 0, right: 0,
        opacity: sloganOp,
        textAlign: "center",
        fontFamily: LATO, fontWeight: 700,
        fontSize: 24, color: GOLD, letterSpacing: 3,
      }}>
        kachelöfen-härter.de
      </div>
    </AbsoluteFill>
  );
};

// ─── Final fade ────────────────────────────────────────────
const FadeBlack = ({ frame, total }: { frame: number; total: number }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return (
    <AbsoluteFill style={{ background: BLACK, opacity: op, pointerEvents: "none" }} />
  );
};

// ─── Root ─────────────────────────────────────────────────
export const KachelofenHaerterVertical = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: TOTAL } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BLACK, overflow: "hidden" }}>
      <SceneHook     frame={frame} />
      <SceneValues   frame={frame} />
      <SceneServices frame={frame} />
      <SceneCTA      frame={frame} />
      <FadeBlack     frame={frame} total={TOTAL} />
    </AbsoluteFill>
  );
};
