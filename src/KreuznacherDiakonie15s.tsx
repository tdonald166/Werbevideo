import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

// ─── Brand ────────────────────────────────────────────────
const MAGENTA = "#be0072";
const MAGENTA_DARK = "#8a0052";
const WHITE = "#ffffff";
const INK = "#1a1a1a";

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

// ─── Cross logo (SVG) ─────────────────────────────────────
const Cross = ({ size = 80, color = WHITE }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <rect x="25" y="6"  width="10" height="48" rx="3" fill={color} />
    <rect x="6"  y="25" width="48" height="10" rx="3" fill={color} />
  </svg>
);

// ─── Service icons (SVG, no emoji) ────────────────────────
const IconHeart = ({ color = WHITE }: { color?: string }) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z"
      stroke={color} strokeWidth="2" strokeLinejoin="round"
    />
  </svg>
);
const IconUsers = ({ color = WHITE }: { color?: string }) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="2" />
    <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="2" />
    <path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 19c0-2 2-4 4-4s2 1.5 2 4"
      stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconAccess = ({ color = WHITE }: { color?: string }) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="4" r="2" fill={color} />
    <path d="M12 7v6h4l3 5M8 11l-2 8M12 13a5 5 0 1 0 5 5"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconHospice = ({ color = WHITE }: { color?: string }) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
    <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z"
      stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 9v4M10 11h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ─── SCENE 1 — Hook „136 Jahre" (0–3s) ───────────────────
const SceneHook = ({ frame }: { frame: number }) => {
  const START = 0, END = 90;
  if (frame >= END) return null;

  const bgScale = ci(frame, [START, END], [1.0, 1.05], EI);
  const numScale = ci(frame, [START, START + 20], [0.4, 1], POP);
  const numOp    = ci(frame, [START, START + 12], [0, 1], EO);
  const subOp    = ci(frame, [25, 45], [0, 1], EO);
  const subY     = ci(frame, [25, 45], [20, 0], EO);
  const exitOp   = ci(frame, [END - 15, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${MAGENTA} 0%, ${MAGENTA_DARK} 100%)`,
      transform: `scale(${bgScale})`,
      opacity: exitOp,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Soft radial highlight */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
      }} />

      <div style={{
        opacity: numOp,
        transform: `scale(${numScale})`,
        fontFamily: "'Arial Black', Arial, sans-serif",
        fontWeight: 900, fontSize: 280,
        color: WHITE, lineHeight: 1,
        letterSpacing: -8,
        textShadow: "0 8px 60px rgba(0,0,0,0.25)",
      }}>
        136
      </div>

      <div style={{
        opacity: subOp,
        transform: `translateY(${subY}px)`,
        fontFamily: "Georgia, serif", fontStyle: "italic",
        fontSize: 56, color: WHITE,
        marginTop: -12,
        textShadow: "0 4px 30px rgba(0,0,0,0.25)",
      }}>
        Jahre Nächstenliebe
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — „Hilfe in allen Lebensphasen" (3–7s) ──────
const SERVICES = [
  { Icon: IconUsers,   label: "Familien & Kinder" },
  { Icon: IconHeart,   label: "Senioren & Pflege" },
  { Icon: IconAccess,  label: "Menschen mit Behinderung" },
  { Icon: IconHospice, label: "Hospiz & Begleitung" },
];

const SceneServices = ({ frame }: { frame: number }) => {
  const START = 90, END = 210;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp     = ci(f, [0, 12], [0, 1], EO);
  const headOp   = ci(f, [10, 30], [0, 1], EO);
  const headY    = ci(f, [10, 30], [30, 0], EO);
  const exit     = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: WHITE, opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 40,
    }}>
      <div style={{
        opacity: headOp,
        transform: `translateY(${headY}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "Arial, sans-serif", fontWeight: 900,
          fontSize: 64, color: INK, lineHeight: 1.1,
        }}>
          Hilfe in allen Lebensphasen
        </div>
        <div style={{
          width: 120, height: 4, background: MAGENTA,
          margin: "16px auto 0", borderRadius: 2,
        }} />
      </div>

      <div style={{ display: "flex", gap: 56, marginTop: 24 }}>
        {SERVICES.map((s, i) => {
          const sStart = 35 + i * 14;
          const op  = ci(f, [sStart, sStart + 20], [0, 1], EO);
          const sc  = ci(f, [sStart, sStart + 24], [0, 1], POP);
          const ty  = ci(f, [sStart, sStart + 24], [40, 0], EO);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              transformOrigin: "center bottom",
              textAlign: "center", width: 200,
            }}>
              <div style={{
                width: 110, height: 110, borderRadius: "50%",
                background: MAGENTA,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: `0 10px 30px ${MAGENTA}55`,
              }}>
                <s.Icon color={WHITE} />
              </div>
              <div style={{
                fontFamily: "Arial, sans-serif", fontWeight: 700,
                fontSize: 18, color: INK, lineHeight: 1.3,
              }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — Reichweite (7–11s) ─────────────────────────
const STATS = [
  { num: "8.000", label: "Menschen täglich" },
  { num: "5",     label: "Krankenhäuser" },
  { num: "136",   label: "Jahre Erfahrung" },
];

const SceneReach = ({ frame }: { frame: number }) => {
  const START = 210, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${INK} 0%, #2a1020 100%)`,
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 64,
    }}>
      {/* magenta accent line top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 6, background: MAGENTA,
        transform: `scaleX(${ci(f, [0, 25], [0, 1], EO)})`,
        transformOrigin: "left center",
      }} />

      <div style={{ display: "flex", gap: 90 }}>
        {STATS.map((s, i) => {
          const sStart = 12 + i * 16;
          const op  = ci(f, [sStart, sStart + 18], [0, 1], EO);
          const ty  = ci(f, [sStart, sStart + 22], [50, 0], EO);
          const sc  = ci(f, [sStart, sStart + 28], [0.7, 1], POP);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Arial Black', Arial, sans-serif",
                fontWeight: 900, fontSize: 130,
                color: MAGENTA, lineHeight: 1,
                letterSpacing: -4,
                textShadow: `0 4px 30px ${MAGENTA}55`,
              }}>
                {s.num}
              </div>
              <div style={{
                fontFamily: "Arial, sans-serif", fontWeight: 600,
                fontSize: 22, color: WHITE, marginTop: 8,
                letterSpacing: 1,
              }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        opacity: ci(f, [60, 80], [0, 1], EO),
        transform: `translateY(${ci(f, [60, 80], [20, 0], EO)}px)`,
        fontFamily: "Georgia, serif", fontStyle: "italic",
        fontSize: 32, color: "rgba(255,255,255,0.85)",
        textAlign: "center",
      }}>
        Rheinland-Pfalz · Saarland
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — CTA „Die Geschichte lebt weiter" (11–15s) ──
const SceneCTA = ({ frame }: { frame: number }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);

  // Headline
  const headOp = ci(f, [8, 28], [0, 1], EO);
  const headY  = ci(f, [8, 28], [30, 0], EO);

  // Logo block
  const logoOp = ci(f, [30, 50], [0, 1], EO);
  const logoSc = ci(f, [30, 55], [0.85, 1], POP);

  // CTA button
  const btnOp = ci(f, [55, 75], [0, 1], EO);
  const btnSc = ci(f, [55, 80], [0.7, 1], POP);
  // pulse after appearance
  const pulse = f >= 80 ? 1 + Math.sin((f - 80) / 6) * 0.04 : 1;
  const glow  = f >= 80 ? 28 + Math.sin((f - 80) / 6) * 14 : 28;

  // Final fade
  const fade = ci(f, [END - START - 10, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${MAGENTA} 0%, ${MAGENTA_DARK} 100%)`,
      opacity: bgOp * fade,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
      }} />

      {/* Claim */}
      <div style={{
        opacity: headOp,
        transform: `translateY(${headY}px)`,
        fontFamily: "Georgia, serif", fontStyle: "italic",
        fontSize: 78, color: WHITE, textAlign: "center",
        lineHeight: 1.1,
        textShadow: "0 4px 30px rgba(0,0,0,0.25)",
      }}>
        Die Geschichte<br />lebt weiter.
      </div>

      {/* Logo + name */}
      <div style={{
        opacity: logoOp,
        transform: `scale(${logoSc})`,
        display: "flex", alignItems: "center", gap: 20,
        marginTop: 12,
      }}>
        <div style={{
          width: 76, height: 76,
          border: `3px solid ${WHITE}`,
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.12)",
        }}>
          <Cross size={48} color={WHITE} />
        </div>
        <div style={{
          fontFamily: "Arial, sans-serif", fontWeight: 800,
          fontSize: 30, color: WHITE, lineHeight: 1.1,
        }}>
          Stiftung<br />kreuznacher diakonie
        </div>
      </div>

      {/* CTA Button */}
      <div style={{
        opacity: btnOp,
        transform: `scale(${btnSc * pulse})`,
        marginTop: 18,
        padding: "20px 56px",
        background: WHITE,
        borderRadius: 999,
        boxShadow: `0 0 ${glow}px rgba(255,255,255,0.6), 0 8px 30px rgba(0,0,0,0.2)`,
        fontFamily: "Arial, sans-serif", fontWeight: 900,
        fontSize: 28, color: MAGENTA,
        letterSpacing: 1,
      }}>
        Jetzt spenden
      </div>

      {/* URL */}
      <div style={{
        opacity: btnOp,
        marginTop: 4,
        fontFamily: "Arial, sans-serif", fontSize: 22,
        color: "rgba(255,255,255,0.9)",
      }}>
        kreuznacherdiakonie.de
      </div>
    </AbsoluteFill>
  );
};

// ─── Final fade to black ──────────────────────────────────
const FadeBlack = ({ frame, total }: { frame: number; total: number }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return (
    <AbsoluteFill style={{
      background: "#000", opacity: op, pointerEvents: "none",
    }} />
  );
};

// ─── Root ─────────────────────────────────────────────────
export const KreuznacherDiakonie15s = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: TOTAL } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: WHITE, overflow: "hidden" }}>
      <SceneHook     frame={frame} />
      <SceneServices frame={frame} />
      <SceneReach    frame={frame} />
      <SceneCTA      frame={frame} />
      <FadeBlack     frame={frame} total={TOTAL} />
    </AbsoluteFill>
  );
};
