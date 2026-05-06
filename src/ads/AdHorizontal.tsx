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

// ─── SCENE 1 — Hero (0–4s, 0–120f) ─────────────────────────
const SceneHero = ({ frame, c }: { frame: number; c: AdConfig }) => {
  const START = 0, END = 120;
  if (frame >= END) return null;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const lines = c.headline.split("\n");

  const heroOp = ci(frame, [0, 24], [0, 1], EO);
  const heroSc = ci(frame, [0, 30], [1.05, 1.0], EO);
  const heroPan = ci(frame, [0, END], [0, -30], EI);

  const logoOp = ci(frame, [10, 28], [0, 1], EO);
  const logoY  = ci(frame, [10, 30], [-30, 0], EO);

  const sloganOp = ci(frame, [22, 40], [0, 1], EO);
  const sloganY  = ci(frame, [22, 42], [10, 0], EO);

  const head1Op = ci(frame, [30, 48], [0, 1], EO);
  const head1X  = ci(frame, [30, 50], [-60, 0], EO);
  const head2Op = ci(frame, [44, 62], [0, 1], EO);
  const head2X  = ci(frame, [44, 64], [-60, 0], EO);

  const lineOp = ci(frame, [62, 78], [0, 1], EO);
  const lineW  = ci(frame, [62, 88], [0, 380], EO);

  const subOp = ci(frame, [78, 96], [0, 1], EO);
  const subY  = ci(frame, [78, 96], [20, 0], EO);

  const exit = ci(frame, [END - 18, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{ background: c.design.ink, opacity: exit }}>
      {/* Hero photo */}
      {c.assets.hero && (
        <AbsoluteFill style={{
          opacity: heroOp,
          transform: `scale(${heroSc}) translateX(${heroPan}px)`,
          transformOrigin: "center center",
        }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
          }} />
        </AbsoluteFill>
      )}

      {/* Dark gradient overlay for left text legibility */}
      <AbsoluteFill style={{
        background: `linear-gradient(90deg,
          ${c.design.ink}f0 0%,
          ${c.design.ink}cc 35%,
          transparent 65%)`,
      }} />
      {/* Bottom vignette */}
      <AbsoluteFill style={{
        background: `linear-gradient(180deg, transparent 50%, ${c.design.ink}aa 100%)`,
      }} />

      {/* Logo + name */}
      <div style={{
        position: "absolute", top: 60, left: 80,
        opacity: logoOp,
        transform: `translateY(${logoY}px)`,
      }}>
        {c.assets.logo ? (
          <Img src={staticFile(c.assets.logo)} style={{ height: 90, display: "block" }} />
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <svg width="68" height="68" viewBox="0 0 64 64">
              <path d="M6 38 L32 14 L58 38 L52 38 L52 56 L36 56 L36 42 L28 42 L28 56 L12 56 L12 38 Z"
                    fill="none" stroke={c.design.accent} strokeWidth="4" strokeLinejoin="round" />
            </svg>
            <div>
              <div style={{
                fontFamily: HEAD, fontSize: 44,
                color: c.design.white, lineHeight: 1.0,
                letterSpacing: 1, fontWeight: 700,
              }}>
                {c.unternehmen.name.split(" ")[0].toUpperCase()}
              </div>
              <div style={{
                fontFamily: BODY, fontSize: 16,
                color: c.design.white, opacity: 0.9,
                marginTop: 2, fontWeight: 500,
              }}>
                {c.unternehmen.name.split(" ").slice(1).join(" ")}
              </div>
            </div>
          </div>
        )}
        <div style={{
          opacity: sloganOp,
          transform: `translateY(${sloganY}px)`,
          fontFamily: SCRIPT, fontSize: 38,
          color: c.design.accent, marginTop: 6,
          marginLeft: 80,
        }}>
          {c.unternehmen.slogan}
        </div>
      </div>

      {/* Headline */}
      <div style={{
        position: "absolute", left: 80, top: 320,
      }}>
        <div style={{
          opacity: head1Op,
          transform: `translateX(${head1X}px)`,
          fontFamily: HEAD, fontWeight: 700,
          fontSize: 110, color: c.design.white,
          lineHeight: 1.0, letterSpacing: -1,
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}>
          {lines[0]?.toUpperCase()}
        </div>
        {lines[1] && (
          <div style={{
            opacity: head2Op,
            transform: `translateX(${head2X}px)`,
            fontFamily: HEAD, fontWeight: 700,
            fontSize: 110, color: c.design.white,
            lineHeight: 1.0, letterSpacing: -1, marginTop: 4,
            textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          }}>
            {lines[1].toUpperCase()}
          </div>
        )}
        <div style={{
          width: lineW, height: 5,
          background: c.design.accent,
          marginTop: 22,
          opacity: lineOp,
          boxShadow: `0 0 20px ${c.design.accent}88`,
        }} />
        <div style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontFamily: BODY, fontWeight: 500,
          fontSize: 30, color: c.design.white,
          marginTop: 22, maxWidth: 700,
          lineHeight: 1.4,
        }}>
          {c.subheadline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — Vorteile (4–8s, 120–240f) ───────────────────
const SceneVorteile = ({ frame, c }: { frame: number; c: AdConfig }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  const headOp = ci(f, [4, 22], [0, 1], EO);
  const headY  = ci(f, [4, 24], [30, 0], EO);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, ${c.design.ink} 100%)`,
      opacity: bgOp * exit,
    }}>
      {/* Diagonal accent stripe */}
      <div style={{
        position: "absolute",
        top: -200, right: -200,
        width: 800, height: 800,
        background: c.design.accent,
        opacity: 0.12,
        transform: "rotate(35deg)",
      }} />

      <div style={{
        position: "absolute", top: 100, left: 0, right: 0,
        opacity: headOp,
        transform: `translateY(${headY}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: 72, color: c.design.white,
          letterSpacing: 1, lineHeight: 1.0,
        }}>
          IHRE VORTEILE
        </div>
        <div style={{
          width: 120, height: 4, background: c.design.accent,
          margin: "16px auto 0", borderRadius: 2,
        }} />
      </div>

      {/* 3 cards */}
      <div style={{
        position: "absolute", top: 360, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 40,
        padding: "0 80px",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 24 + i * 14;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 26], [50, 0], EO);
          const sc = ci(f, [sStart, sStart + 28], [0.85, 1], POP);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              flex: 1, maxWidth: 460,
              padding: "44px 28px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              border: `2px solid ${c.design.accent}66`,
              borderRadius: 16,
              boxShadow: `0 16px 40px rgba(0,0,0,0.4)`,
              textAlign: "center",
            }}>
              {/* Number */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: c.design.accent,
                margin: "0 auto 22px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: HEAD, fontSize: 38, fontWeight: 700,
                color: c.design.white,
                boxShadow: `0 8px 24px ${c.design.accent}77`,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: 36, color: c.design.white,
                letterSpacing: 0.5, lineHeight: 1.1,
                marginBottom: 10,
              }}>
                {v.titel.toUpperCase()}
              </div>
              {v.beschreibung && (
                <div style={{
                  fontFamily: BODY, fontWeight: 400,
                  fontSize: 22, color: "rgba(255,255,255,0.8)",
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

// ─── SCENE 3 — CTA Banner (8–11s, 240–330f) ────────────────
const SceneCTA = ({ frame, c }: { frame: number; c: AdConfig }) => {
  const START = 240, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 16, END - START], [1, 0], EIN);

  const kickerOp = ci(f, [4, 22], [0, 1], EO);
  const kickerY  = ci(f, [4, 24], [-20, 0], EO);

  const ctaOp = ci(f, [16, 38], [0, 1], EO);
  const ctaSc = ci(f, [16, 42], [0.7, 1], POP);

  const arrowX = ci(f, [38, 58], [-30, 0], EO);

  // Pulse after appearance
  const pulse = f >= 50 ? 1 + Math.sin((f - 50) * 0.18) * 0.025 : 1;

  return (
    <AbsoluteFill style={{
      background: c.design.ink,
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 30,
    }}>
      {/* Animated red bg gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, ${c.design.accent}33 0%, transparent 60%)`,
      }} />

      <div style={{
        opacity: kickerOp,
        transform: `translateY(${kickerY}px)`,
        fontFamily: BODY, fontWeight: 600,
        fontSize: 28, color: c.design.accent,
        letterSpacing: 6, textTransform: "uppercase",
      }}>
        {c.cta.kicker}
      </div>

      <div style={{
        opacity: ctaOp,
        transform: `scale(${ctaSc * pulse})`,
        background: c.design.accent,
        padding: "30px 80px",
        borderRadius: 12,
        boxShadow: `0 20px 60px ${c.design.accent}77, 0 0 0 4px rgba(255,255,255,0.08)`,
        display: "flex", alignItems: "center", gap: 30,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: 76, color: c.design.white,
          letterSpacing: 1, lineHeight: 1,
        }}>
          {c.cta.text.toUpperCase()}
        </div>
        <div style={{
          opacity: f >= 38 ? 1 : 0,
          transform: `translateX(${arrowX}px)`,
          fontSize: 80, color: c.design.white,
          lineHeight: 1,
        }}>
          ›
        </div>
      </div>

      <div style={{
        opacity: ctaOp,
        marginTop: 16,
        fontFamily: BODY, fontWeight: 700,
        fontSize: 36, color: c.design.white,
        letterSpacing: 1,
      }}>
        ☎ {c.kontakt.telefon_buero}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — Kontakt (11–15s, 330–450f) ──────────────────
const SceneContact = ({ frame, c }: { frame: number; c: AdConfig }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const bgOp = ci(f, [0, 14], [0, 1], EO);

  const titleOp = ci(f, [4, 24], [0, 1], EO);
  const titleY  = ci(f, [4, 26], [-30, 0], EO);

  const fade = ci(f, [END - START - 12, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, ${c.design.ink} 100%)`,
      opacity: bgOp * fade,
    }}>
      {/* Hero photo as subtle background */}
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.18 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(10px) brightness(0.5)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.1], EI)})`,
          }} />
        </AbsoluteFill>
      )}

      <div style={{
        position: "absolute", top: 80, left: 0, right: 0,
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: 88, color: c.design.white,
          letterSpacing: 1, lineHeight: 1,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        <div style={{
          fontFamily: SCRIPT, fontSize: 56,
          color: c.design.accent, marginTop: 4,
        }}>
          {c.unternehmen.slogan}
        </div>
      </div>

      {/* Contact grid */}
      <div style={{
        position: "absolute", top: 320, left: 0, right: 0,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 36, padding: "0 140px",
      }}>
        {[
          { ic: "📍", lines: [c.kontakt.adresse_zeile1, c.kontakt.adresse_zeile2], delay: 16 },
          { ic: "☎",  lines: [c.kontakt.telefon_buero,
                              c.kontakt.telefon_lager ? `Lager: ${c.kontakt.telefon_lager}` : ""].filter(Boolean), delay: 26 },
          { ic: "✉",  lines: [c.kontakt.email], delay: 36 },
          { ic: "🌐", lines: [c.kontakt.website], delay: 46 },
        ].map((item, i) => {
          const op = ci(f, [item.delay, item.delay + 18], [0, 1], EO);
          const tx = ci(f, [item.delay, item.delay + 22], [-30, 0], EO);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${tx}px)`,
              display: "flex", alignItems: "center", gap: 22,
              padding: "20px 28px",
              background: "rgba(255,255,255,0.06)",
              border: `2px solid ${c.design.accent}66`,
              borderRadius: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: c.design.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
              }}>
                {item.ic}
              </div>
              <div>
                {item.lines.map((l, j) => (
                  <div key={j} style={{
                    fontFamily: BODY, fontWeight: j === 0 ? 700 : 500,
                    fontSize: j === 0 ? 26 : 22,
                    color: c.design.white, lineHeight: 1.3,
                  }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hours */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0,
        opacity: ci(f, [60, 80], [0, 1], EO),
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: 26, color: c.design.accent,
          letterSpacing: 4, marginBottom: 8,
        }}>
          BÜROZEITEN
        </div>
        <div style={{
          fontFamily: BODY, fontWeight: 500,
          fontSize: 22, color: c.design.white,
          lineHeight: 1.7,
        }}>
          {c.oeffnungszeiten.mo_do}<br />
          {c.oeffnungszeiten.fr}
          {c.oeffnungszeiten.hinweis && (
            <div style={{ fontSize: 18, opacity: 0.8, marginTop: 8 }}>
              {c.oeffnungszeiten.hinweis}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Final fade ────────────────────────────────────────────
const FadeBlack = ({ frame, total, ink }: { frame: number; total: number; ink: string }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return <AbsoluteFill style={{ background: ink, opacity: op, pointerEvents: "none" }} />;
};

// ─── Root ──────────────────────────────────────────────────
export const AdHorizontal: React.FC<{ config: AdConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const TOTAL = 450;
  return (
    <AbsoluteFill style={{ background: config.design.ink, overflow: "hidden" }}>
      <SceneHero     frame={frame} c={config} />
      <SceneVorteile frame={frame} c={config} />
      <SceneCTA      frame={frame} c={config} />
      <SceneContact  frame={frame} c={config} />
      <FadeBlack     frame={frame} total={TOTAL} ink={config.design.ink} />
    </AbsoluteFill>
  );
};
