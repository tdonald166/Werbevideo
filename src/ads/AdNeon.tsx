import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
  staticFile,
  random,
} from "remotion";
import type { AdConfig } from "./types";
import { font } from "./fonts";

const EO  = Easing.bezier(0.16, 1, 0.3, 1);
const EIN = Easing.bezier(0.55, 0, 1, 0.45);
const EI  = Easing.bezier(0.45, 0, 0.55, 1);
const POP = Easing.bezier(0.34, 1.56, 0.64, 1);

// Cyberpunk palette (overrides config accent for neon vibe)
const NEON_M = "#ff2bd6";
const NEON_C = "#00f5ff";
const NEON_Y = "#fff700";

const ci = (
  f: number,
  range: [number, number],
  out: [number, number],
  ease = EI,
) => interpolate(f, range, out, {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: ease,
});

// Glitch step — random horizontal offset on certain frames
const useGlitch = (frame: number, intensity = 8) => {
  const tick = Math.floor(frame / 3);
  const trigger = random(`glitch-${tick}`) > 0.85;
  return {
    x: trigger ? (random(`gx-${tick}`) - 0.5) * intensity * 4 : 0,
    active: trigger,
  };
};

// ─── CRT Scanlines ─────────────────────────────────────────
const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => (
  <AbsoluteFill style={{
    pointerEvents: "none",
    backgroundImage: `repeating-linear-gradient(
      0deg,
      rgba(0,0,0,0) 0,
      rgba(0,0,0,0) 2px,
      rgba(0,0,0,0.7) 3px,
      rgba(0,0,0,0) 4px
    )`,
    opacity, mixBlendMode: "multiply",
  }} />
);

// ─── Animated grid ─────────────────────────────────────────
const NeonGrid: React.FC<{ frame: number; color?: string }> = ({ frame, color = NEON_M }) => {
  const offset = (frame * 1.2) % 80;
  return (
    <AbsoluteFill style={{
      pointerEvents: "none",
      backgroundImage: `
        linear-gradient(${color}33 1px, transparent 1px),
        linear-gradient(90deg, ${color}33 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px",
      backgroundPosition: `0 ${offset}px, ${offset}px 0`,
      opacity: 0.5,
    }} />
  );
};

// ─── RGB Chromatic aberration text ─────────────────────────
const ChromaText: React.FC<{
  text: string; fontFamily: string; size: number; weight?: number;
  letterSpacing?: number; lineHeight?: number;
  color?: string; offset?: number;
}> = ({ text, fontFamily, size, weight = 700, letterSpacing = 0, lineHeight = 1, color = "#fff", offset = 4 }) => {
  const baseStyle: React.CSSProperties = {
    fontFamily, fontSize: size, fontWeight: weight,
    letterSpacing, lineHeight, whiteSpace: "pre-wrap",
    position: "absolute", inset: 0,
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span style={{ ...baseStyle, position: "static", color }}>{text}</span>
      <span style={{ ...baseStyle, color: NEON_C, mixBlendMode: "screen", transform: `translate(${-offset}px, 0)` }}>{text}</span>
      <span style={{ ...baseStyle, color: NEON_M, mixBlendMode: "screen", transform: `translate(${offset}px, 0)` }}>{text}</span>
    </div>
  );
};

// ─── Glitch reveal block ───────────────────────────────────
const GlitchReveal: React.FC<{
  frame: number; startFrame: number; children: React.ReactNode;
}> = ({ frame, startFrame, children }) => {
  const f = frame - startFrame;
  const baseOp = ci(f, [0, 12], [0, 1], EO);
  const tick = Math.floor(f / 2);
  const slice = random(`gs-${tick}`);
  const flicker = f < 18 ? (slice > 0.6 ? 1 : 0.4) : 1;
  const slip = f < 18 ? (random(`gp-${tick}`) - 0.5) * 24 : 0;
  return (
    <div style={{
      opacity: baseOp * flicker,
      transform: `translateX(${slip}px)`,
    }}>
      {children}
    </div>
  );
};

// ─── SCENE 1 — Hero with glitch intro ──────────────────────
const SceneHero = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 0, END = 120;
  if (frame >= END) return null;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const heroOp = ci(frame, [0, 24], [0, 1], EO);
  const heroSc = ci(frame, [0, END], [1.15, 1.0], EI);
  const glitch = useGlitch(frame, 14);

  const lines = c.headline.split("\n");
  const exit = ci(frame, [END - 18, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{ background: "#0a0014", opacity: exit }}>
      {/* Hero photo with glitch slip */}
      {c.assets.hero && (
        <AbsoluteFill style={{
          opacity: heroOp,
          transform: `scale(${heroSc}) translateX(${glitch.x * 0.5}px)`,
          filter: `hue-rotate(${ci(frame, [0, 60], [-30, 0], EO)}deg) saturate(1.4) contrast(1.2)`,
        }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
          }} />
          {/* Color overlay */}
          <AbsoluteFill style={{
            background: `linear-gradient(135deg, ${NEON_M}33 0%, ${NEON_C}33 100%)`,
            mixBlendMode: "color",
          }} />
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{
        background: vertical
          ? `linear-gradient(180deg, transparent 30%, rgba(10,0,20,0.95) 100%)`
          : `linear-gradient(90deg, rgba(10,0,20,0.92) 0%, rgba(10,0,20,0.4) 60%, transparent 100%)`,
      }} />

      <NeonGrid frame={frame} color={NEON_M} />
      <Scanlines opacity={0.22} />

      {/* Top tag */}
      <div style={{
        position: "absolute",
        top: vertical ? 80 : 60,
        left: vertical ? 0 : 80, right: vertical ? 0 : "auto",
        textAlign: vertical ? "center" : "left",
        opacity: ci(frame, [10, 30], [0, 1], EO),
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "6px 18px",
          border: `1.5px solid ${NEON_C}`,
          borderRadius: 4,
          background: "rgba(0,245,255,0.06)",
          fontFamily: BODY, fontWeight: 700, fontSize: vertical ? 22 : 18,
          color: NEON_C, letterSpacing: 4,
          boxShadow: `0 0 20px ${NEON_C}55, inset 0 0 20px ${NEON_C}22`,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: NEON_C,
            boxShadow: `0 0 12px ${NEON_C}`,
            animation: "pulse 1s infinite",
          }} />
          {c.unternehmen.name.toUpperCase()}
        </div>
      </div>

      {/* Headline */}
      <div style={{
        position: "absolute",
        top: vertical ? 1100 : 320,
        left: vertical ? 0 : 80,
        right: vertical ? 0 : "auto",
        padding: vertical ? "0 60px" : 0,
        textAlign: vertical ? "center" : "left",
        transform: `translateX(${glitch.x}px)`,
      }}>
        <GlitchReveal frame={frame} startFrame={28}>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 110 : 130,
            lineHeight: 1, letterSpacing: -1,
          }}>
            <ChromaText
              text={(lines[0] || "").toUpperCase()}
              fontFamily={HEAD}
              size={vertical ? 110 : 130}
              weight={700}
              letterSpacing={-1}
              lineHeight={1}
              color="#fff"
              offset={3}
            />
          </div>
        </GlitchReveal>
        {lines[1] && (
          <div style={{ marginTop: 12 }}>
            <GlitchReveal frame={frame} startFrame={48}>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 110 : 130,
                lineHeight: 1, letterSpacing: -1,
                color: NEON_M,
                textShadow: `0 0 30px ${NEON_M}, 0 0 60px ${NEON_M}88`,
              }}>
                {lines[1].toUpperCase()}
              </div>
            </GlitchReveal>
          </div>
        )}

        {/* Sub */}
        <div style={{
          marginTop: 28,
          opacity: ci(frame, [78, 100], [0, 1], EO),
          transform: `translateY(${ci(frame, [78, 100], [20, 0], EO)}px)`,
          fontFamily: BODY, fontWeight: 500,
          fontSize: vertical ? 30 : 28,
          color: "#fff",
          maxWidth: vertical ? "100%" : 720,
          lineHeight: 1.4,
          textShadow: `0 0 12px ${NEON_C}77`,
        }}>
          <span style={{ color: NEON_C, marginRight: 10 }}>▸</span>
          {c.subheadline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — Vorteile (numbered terminal style) ─────────
const SceneVorteile = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  const headOp = ci(f, [4, 24], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, #1a0030 0%, #050010 80%)`,
      opacity: bgOp * exit,
    }}>
      <NeonGrid frame={frame} color={NEON_C} />
      <Scanlines opacity={0.2} />

      <div style={{
        position: "absolute",
        top: vertical ? 180 : 100,
        left: 0, right: 0,
        opacity: headOp,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 22 : 20,
          color: NEON_C, letterSpacing: 8, marginBottom: 12,
          textShadow: `0 0 20px ${NEON_C}`,
        }}>
          [ SYSTEM://VORTEILE.LOAD ]
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 110, lineHeight: 1,
        }}>
          <ChromaText
            text="WARUM WIR"
            fontFamily={HEAD}
            size={vertical ? 130 : 110}
            color="#fff"
            offset={4}
            lineHeight={1}
            letterSpacing={2}
          />
        </div>
      </div>

      {/* Terminal-style cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 580 : 380,
        left: vertical ? 60 : 100, right: vertical ? 60 : 100,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 28 : 32,
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 22 + i * 14;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const sc = ci(f, [sStart, sStart + 28], [0.85, 1], POP);
          // Type-on effect for title
          const charProgress = ci(f, [sStart + 8, sStart + 8 + v.titel.length * 1.5], [0, v.titel.length], EO);
          const visibleTitle = v.titel.slice(0, Math.floor(charProgress));
          const cursorVisible = (f * 0.3) % 2 < 1;
          const accentColor = i === 0 ? NEON_M : i === 1 ? NEON_C : NEON_Y;

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${sc})`,
              flex: 1,
              padding: vertical ? "28px 30px" : "36px 28px",
              background: `linear-gradient(135deg, rgba(${accentColor === NEON_M ? "255,43,214" : accentColor === NEON_C ? "0,245,255" : "255,247,0"},0.08) 0%, rgba(0,0,0,0.5) 100%)`,
              border: `2px solid ${accentColor}`,
              borderRadius: 4,
              boxShadow: `0 0 30px ${accentColor}77, inset 0 0 30px ${accentColor}11`,
              position: "relative",
            }}>
              {/* Corner brackets */}
              <div style={{ position: "absolute", top: -2, left: -2, width: 18, height: 18, borderTop: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}` }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 18, height: 18, borderTop: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}` }} />
              <div style={{ position: "absolute", bottom: -2, left: -2, width: 18, height: 18, borderBottom: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}` }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderBottom: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}` }} />

              <div style={{
                fontFamily: BODY, fontWeight: 700,
                fontSize: vertical ? 18 : 16,
                color: accentColor, letterSpacing: 4,
                marginBottom: 12,
                textShadow: `0 0 12px ${accentColor}`,
              }}>
                ▸ 0{i + 1}.
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 44 : 36,
                color: "#fff", letterSpacing: 0.5,
                lineHeight: 1.05, marginBottom: 12,
                textShadow: `0 0 24px ${accentColor}88`,
                minHeight: vertical ? 56 : 44,
              }}>
                {visibleTitle.toUpperCase()}
                {f < sStart + 8 + v.titel.length * 1.5 + 4 && cursorVisible && (
                  <span style={{ color: accentColor }}>_</span>
                )}
              </div>
              {v.beschreibung && (
                <div style={{
                  opacity: ci(f, [sStart + 8 + v.titel.length * 1.5, sStart + 12 + v.titel.length * 1.5 + 8], [0, 1], EO),
                  fontFamily: BODY, fontWeight: 400,
                  fontSize: vertical ? 24 : 20,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.4,
                }}>
                  {v.beschreibung}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — CTA ─────────────────────────────────────────
const SceneCTA = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 240, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 12], [0, 1], EO);
  const exit = ci(f, [END - START - 16, END - START], [1, 0], EIN);

  const glitch = useGlitch(START + f, 12);

  const ctaOp = ci(f, [12, 32], [0, 1], EO);
  const ctaSc = ci(f, [12, 36], [0.6, 1], POP);
  const pulse = f >= 40 ? 1 + Math.sin((f - 40) * 0.18) * 0.04 : 1;
  const glow = 30 + Math.sin(f * 0.16) * 20;

  const phoneOp = ci(f, [38, 60], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: "#000",
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 30, padding: "0 60px",
    }}>
      <NeonGrid frame={frame} color={NEON_M} />
      <Scanlines opacity={0.18} />

      {/* Animated radial pulse */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, ${NEON_M}33 0%, transparent 50%)`,
        opacity: 0.4 + Math.sin(f * 0.14) * 0.3,
      }} />

      <div style={{
        opacity: ci(f, [4, 22], [0, 1], EO),
        fontFamily: BODY, fontWeight: 700,
        fontSize: vertical ? 26 : 22,
        color: NEON_C, letterSpacing: 10,
        textTransform: "uppercase",
        textShadow: `0 0 20px ${NEON_C}`,
        textAlign: "center",
      }}>
        ▶ {c.cta.kicker} ◀
      </div>

      <div style={{
        opacity: ctaOp,
        transform: `scale(${ctaSc * pulse}) translateX(${glitch.x * 0.3}px)`,
        position: "relative",
      }}>
        <div style={{
          padding: vertical ? "36px 48px" : "32px 70px",
          background: `linear-gradient(135deg, ${NEON_M} 0%, ${NEON_C} 200%)`,
          borderRadius: 4,
          border: `4px solid #fff`,
          boxShadow: `0 0 ${glow}px ${NEON_M}, 0 0 ${glow * 1.5}px ${NEON_C}77, 0 30px 80px rgba(0,0,0,0.7)`,
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 76 : 86,
          color: "#fff", letterSpacing: 1.5, lineHeight: 1.05,
          textShadow: `0 0 20px #fff, 0 4px 20px rgba(0,0,0,0.5)`,
          textAlign: "center",
          textTransform: "uppercase",
        }}>
          {c.cta.text}
        </div>
        {/* Corner brackets */}
        <div style={{ position: "absolute", top: -10, left: -10, width: 24, height: 24, borderTop: `4px solid ${NEON_C}`, borderLeft: `4px solid ${NEON_C}`, boxShadow: `0 0 16px ${NEON_C}` }} />
        <div style={{ position: "absolute", top: -10, right: -10, width: 24, height: 24, borderTop: `4px solid ${NEON_C}`, borderRight: `4px solid ${NEON_C}`, boxShadow: `0 0 16px ${NEON_C}` }} />
        <div style={{ position: "absolute", bottom: -10, left: -10, width: 24, height: 24, borderBottom: `4px solid ${NEON_C}`, borderLeft: `4px solid ${NEON_C}`, boxShadow: `0 0 16px ${NEON_C}` }} />
        <div style={{ position: "absolute", bottom: -10, right: -10, width: 24, height: 24, borderBottom: `4px solid ${NEON_C}`, borderRight: `4px solid ${NEON_C}`, boxShadow: `0 0 16px ${NEON_C}` }} />
      </div>

      <div style={{
        opacity: phoneOp,
        marginTop: 20, textAlign: "center",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 24 : 22,
          color: NEON_Y, letterSpacing: 8,
          textShadow: `0 0 20px ${NEON_Y}`,
          marginBottom: 10,
        }}>
          ☎ DIRECT.LINE
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 96 : 88,
          color: "#fff", letterSpacing: 3,
          lineHeight: 1,
        }}>
          <ChromaText
            text={c.kontakt.telefon_buero}
            fontFamily={HEAD}
            size={vertical ? 96 : 88}
            letterSpacing={3}
            lineHeight={1}
            offset={4}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — Final ───────────────────────────────────────
const SceneFinal = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: "#000",
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.35 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(12px) saturate(1.6) hue-rotate(280deg) brightness(0.5)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.15], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, ${NEON_M}33 0%, transparent 70%)`,
      }} />

      <NeonGrid frame={frame} color={NEON_C} />
      <Scanlines opacity={0.18} />

      <div style={{
        position: "absolute",
        top: vertical ? 380 : 220,
        left: 0, right: 0,
        textAlign: "center", padding: "0 40px",
      }}>
        <GlitchReveal frame={frame} startFrame={START + 4}>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 84 : 100, lineHeight: 1.0,
          }}>
            <ChromaText
              text={c.unternehmen.name.toUpperCase()}
              fontFamily={HEAD}
              size={vertical ? 84 : 100}
              color="#fff"
              offset={4}
              letterSpacing={1}
              lineHeight={1}
            />
          </div>
        </GlitchReveal>
        <div style={{
          opacity: ci(f, [22, 42], [0, 1], EO),
          fontFamily: SCRIPT, fontSize: vertical ? 76 : 76,
          color: NEON_M, marginTop: 12,
          textShadow: `0 0 30px ${NEON_M}, 0 0 60px ${NEON_M}77`,
        }}>
          {c.unternehmen.slogan}
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: vertical ? 200 : 120, left: 0, right: 0,
        opacity: ci(f, [42, 62], [0, 1], EO),
        transform: `translateY(${ci(f, [42, 62], [40, 0], EO)}px)`,
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          flexDirection: vertical ? "column" : "row",
          gap: vertical ? 14 : 36,
          padding: "24px 44px",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          border: `2px solid ${NEON_C}`,
          borderRadius: 4,
          boxShadow: `0 0 40px ${NEON_C}77, inset 0 0 30px ${NEON_C}22`,
        }}>
          {[
            { ic: "▸", t: c.kontakt.telefon_buero },
            { ic: "@", t: c.kontakt.email },
            { ic: "//", t: c.kontakt.website },
          ].map((x, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: BODY, fontWeight: 600,
              fontSize: vertical ? 24 : 22,
              color: "#fff",
            }}>
              <span style={{ color: NEON_C, textShadow: `0 0 12px ${NEON_C}` }}>{x.ic}</span>
              <span>{x.t}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FadeBlack = ({ frame, total }: { frame: number; total: number }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return <AbsoluteFill style={{ background: "#000", opacity: op, pointerEvents: "none" }} />;
};

export const AdNeonH: React.FC<{ config: AdConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <SceneHero     frame={frame} c={config} vertical={false} />
      <SceneVorteile frame={frame} c={config} vertical={false} />
      <SceneCTA      frame={frame} c={config} vertical={false} />
      <SceneFinal    frame={frame} c={config} vertical={false} />
      <FadeBlack     frame={frame} total={450} />
    </AbsoluteFill>
  );
};

export const AdNeonV: React.FC<{ config: AdConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <SceneHero     frame={frame} c={config} vertical={true} />
      <SceneVorteile frame={frame} c={config} vertical={true} />
      <SceneCTA      frame={frame} c={config} vertical={true} />
      <SceneFinal    frame={frame} c={config} vertical={true} />
      <FadeBlack     frame={frame} total={450} />
    </AbsoluteFill>
  );
};
