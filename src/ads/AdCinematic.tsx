import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
  random,
} from "remotion";
import type { AdConfig } from "./types";
import { font, getPreset } from "./fonts";

// Apply font preset to config (overrides fontHead/Body/Script when fontPreset is set)
const applyFontPreset = (c: AdConfig): AdConfig => {
  if (!c.fontPreset) return c;
  const p = getPreset(c.fontPreset);
  return {
    ...c,
    design: {
      ...c.design,
      fontHead: p.head,
      fontBody: p.body,
      fontScript: p.script,
    },
  };
};

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

// ─── Effect: Camera shake ──────────────────────────────────
const useShake = (frame: number, intensity: number, decay: number) => {
  const t = Math.max(0, frame);
  const fade = Math.exp(-t / decay);
  return {
    x: (random(`shx-${Math.floor(t / 2)}`) - 0.5) * intensity * fade,
    y: (random(`shy-${Math.floor(t / 2)}`) - 0.5) * intensity * fade,
  };
};

// ─── Bokeh particles ───────────────────────────────────────
const Bokeh: React.FC<{ frame: number; w: number; h: number; count?: number; color: string }> = ({
  frame, w, h, count = 40, color,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
    {Array.from({ length: count }).map((_, i) => {
      const seed = i + 1;
      const startX = random(`bx-${seed}`) * w;
      const baseY  = random(`by-${seed}`) * h;
      const size   = 8 + random(`bs-${seed}`) * 80;
      const speed  = 0.3 + random(`bv-${seed}`) * 0.6;
      const drift  = (random(`bd-${seed}`) - 0.5) * 80;
      const yPos   = (baseY - frame * speed * 0.6 + h * 2) % (h + 200) - 50;
      const op     = 0.15 + random(`bo-${seed}`) * 0.35;
      const xPos   = startX + Math.sin((frame + i * 30) * 0.02) * drift;
      return (
        <div key={i} style={{
          position: "absolute",
          left: xPos, top: yPos,
          width: size, height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: op,
          filter: "blur(2px)",
        }} />
      );
    })}
  </AbsoluteFill>
);

// ─── Light rays ────────────────────────────────────────────
const LightRays: React.FC<{ frame: number; color: string; angle?: number }> = ({
  frame, color, angle = -25,
}) => {
  const sweep = (frame * 0.3) % 100;
  return (
    <AbsoluteFill style={{
      pointerEvents: "none",
      overflow: "hidden",
      transform: `rotate(${angle}deg) scale(2)`,
      transformOrigin: "center center",
      mixBlendMode: "screen",
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: -200, bottom: -200,
          left: `${(sweep + i * 16) % 110 - 5}%`,
          width: 80,
          background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
          filter: "blur(20px)",
          opacity: 0.4 + (i % 2) * 0.2,
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ─── Letter-by-letter title ────────────────────────────────
const KineticTitle: React.FC<{
  text: string;
  startFrame: number;
  frame: number;
  color: string;
  fontFamily: string;
  size: number;
  perChar?: number;
  shadow?: string;
}> = ({ text, startFrame, frame, color, fontFamily, size, perChar = 2.5, shadow }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", lineHeight: 0.95 }}>
    {text.split("").map((ch, i) => {
      const localF = frame - startFrame - i * perChar;
      const op = ci(localF, [0, 14], [0, 1], EO);
      const ty = ci(localF, [0, 18], [50, 0], EO);
      const sc = ci(localF, [0, 20], [1.4, 1], EO);
      const blur = ci(localF, [0, 14], [10, 0], EO);
      return (
        <span key={i} style={{
          display: "inline-block",
          opacity: op,
          transform: `translateY(${ty}px) scale(${sc})`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          fontFamily, fontSize: size, fontWeight: 700,
          color, letterSpacing: -1, whiteSpace: "pre",
          textShadow: shadow,
        }}>
          {ch === " " ? " " : ch}
        </span>
      );
    })}
  </div>
);

// ─── Headline-Reveal — 12 Varianten ────────────────────────
const RevealedHeadline: React.FC<{
  variant: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l";
  frame: number;
  lines: string[];
  fontFamily: string;
  size: number;
  colorPrimary: string;
  colorAccent: string;
  line1Op: number;
  line2Op: number;
}> = ({ variant, frame, lines, fontFamily, size, colorPrimary, colorAccent, line1Op, line2Op }) => {
  const shadowMain = `0 0 40px ${colorAccent}aa, 0 6px 30px rgba(0,0,0,0.8)`;
  const shadowAccent = `0 0 60px ${colorAccent}, 0 6px 30px rgba(0,0,0,0.8)`;

  // Variant A — Letter by letter kinetic
  if (variant === "a") {
    return (
      <>
        <div style={{ opacity: line1Op }}>
          <KineticTitle
            text={(lines[0] || "").toUpperCase()}
            startFrame={30} frame={frame}
            color={colorPrimary} fontFamily={fontFamily}
            size={size} perChar={2}
            shadow={shadowMain}
          />
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            <KineticTitle
              text={lines[1].toUpperCase()}
              startFrame={48} frame={frame}
              color={colorAccent} fontFamily={fontFamily}
              size={size} perChar={2}
              shadow={shadowAccent}
            />
          </div>
        )}
      </>
    );
  }

  // Variant B — Word by word slide alternating sides
  if (variant === "b") {
    const renderLine = (text: string, startFrame: number, color: string, shadow: string) => {
      const words = text.toUpperCase().split(" ");
      return (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.4em", lineHeight: 1.0 }}>
          {words.map((w, i) => {
            const localF = frame - startFrame - i * 5;
            const op = ci(localF, [0, 14], [0, 1], EO);
            const tx = ci(localF, [0, 18], [(i % 2 === 0 ? -120 : 120), 0], EO);
            const blur = ci(localF, [0, 14], [10, 0], EO);
            return (
              <span key={i} style={{
                display: "inline-block",
                opacity: op,
                transform: `translateX(${tx}px)`,
                filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                fontFamily, fontSize: size, fontWeight: 700,
                color, letterSpacing: -1,
                textShadow: shadow,
              }}>
                {w}
              </span>
            );
          })}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {renderLine(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {renderLine(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant D — Mask reveal (Vorhang-Effekt)
  if (variant === "d") {
    const mask = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const wipe = ci(localF, [0, 24], [0, 100], EO);
      const ty = ci(localF, [0, 18], [40, 0], EO);
      return (
        <div style={{
          position: "relative", display: "inline-block",
          transform: `translateY(${ty}px)`,
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
        }}>
          <div style={{
            fontFamily, fontSize: size, fontWeight: 700,
            color, letterSpacing: -1, lineHeight: 1.0,
            textShadow: shadow,
          }}>
            {text.toUpperCase()}
          </div>
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {mask(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {mask(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant E — Typewriter / monospace effect
  if (variant === "e") {
    const typeWriter = (text: string, startFrame: number, color: string, shadow: string) => {
      const upper = text.toUpperCase();
      const localF = frame - startFrame;
      const visible = Math.max(0, Math.min(upper.length, Math.floor(ci(localF, [0, upper.length * 1.6], [0, upper.length], EO))));
      const cursorBlink = (frame * 0.3) % 2 < 1;
      const showCursor = localF < upper.length * 1.6 + 10;
      return (
        <div style={{
          fontFamily, fontSize: size, fontWeight: 700,
          color, letterSpacing: -1, lineHeight: 1.0,
          textShadow: shadow,
        }}>
          {upper.slice(0, visible)}
          {showCursor && cursorBlink && (
            <span style={{ color: colorAccent, marginLeft: 8 }}>▌</span>
          )}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {typeWriter(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {typeWriter(lines[1], 60, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant F — 3D rotate-flip from below
  if (variant === "f") {
    const flip = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 18], [0, 1], EO);
      const rot = ci(localF, [0, 24], [-80, 0], EO);
      const ty = ci(localF, [0, 22], [80, 0], EO);
      return (
        <div style={{
          opacity: op,
          transform: `perspective(1000px) rotateX(${rot}deg) translateY(${ty}px)`,
          transformOrigin: "center bottom",
          fontFamily, fontSize: size, fontWeight: 700,
          color, letterSpacing: -1, lineHeight: 1.0,
          textShadow: shadow,
        }}>
          {text.toUpperCase()}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {flip(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {flip(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant G — Explosive burst: scale up from 0 with shockwave
  if (variant === "g") {
    const burst = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 12], [0, 1], EO);
      const sc = ci(localF, [0, 18], [0.0, 1], POP);
      const blur = ci(localF, [0, 16], [25, 0], EO);
      // chromatic split during reveal
      const splitX = ci(localF, [0, 20], [12, 0], EO);
      return (
        <div style={{
          position: "relative", display: "inline-block",
          opacity: op,
          transform: `scale(${sc})`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          fontFamily, fontSize: size, fontWeight: 700,
          letterSpacing: -1, lineHeight: 1.0,
        }}>
          <span style={{ position: "absolute", inset: 0, color: colorAccent, transform: `translateX(${-splitX}px)`, mixBlendMode: "screen", opacity: 0.7 }}>{text.toUpperCase()}</span>
          <span style={{ position: "absolute", inset: 0, color: "#00f5ff", transform: `translateX(${splitX}px)`, mixBlendMode: "screen", opacity: 0.5 }}>{text.toUpperCase()}</span>
          <span style={{ position: "relative", color, textShadow: shadow }}>{text.toUpperCase()}</span>
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {burst(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {burst(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant H — Liquid flow: clip-path mask wave
  if (variant === "h") {
    const liquid = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const wave = ci(localF, [0, 30], [-20, 100], EO);
      const op = ci(localF, [0, 16], [0, 1], EO);
      // organic skew
      const skew = Math.sin(localF * 0.1) * (localF < 30 ? 4 : 0);
      const blur = ci(localF, [0, 20], [12, 0], EO);
      return (
        <div style={{
          opacity: op,
          fontFamily, fontSize: size, fontWeight: 700,
          color, letterSpacing: -1, lineHeight: 1.0,
          textShadow: shadow,
          clipPath: `polygon(0 0, ${wave}% 0, ${Math.max(0, wave - 8)}% 100%, 0 100%)`,
          transform: `skewX(${skew}deg)`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }}>
          {text.toUpperCase()}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {liquid(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {liquid(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant I — Retro 3D: chrome extruded with shine sweep
  if (variant === "i") {
    const chrome = (text: string, startFrame: number, color: string, shadow: string, isAccent: boolean) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 18], [0, 1], EO);
      const sc = ci(localF, [0, 24], [1.6, 1], EO);
      const ty = ci(localF, [0, 22], [40, 0], EO);
      // Multi-layer 3D shadow stack
      const layers = Array.from({ length: 8 }).map((_, i) => `${i}px ${i}px 0 ${isAccent ? colorPrimary : colorAccent}`);
      return (
        <div style={{
          opacity: op,
          transform: `scale(${sc}) translateY(${ty}px)`,
          fontFamily, fontSize: size, fontWeight: 700,
          color: isAccent ? colorAccent : colorPrimary,
          letterSpacing: -1, lineHeight: 1.0,
          textShadow: layers.join(", ") + `, 0 0 40px ${colorAccent}`,
        }}>
          {text.toUpperCase()}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {chrome(lines[0] || "", 30, colorPrimary, shadowMain, false)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {chrome(lines[1], 48, colorAccent, shadowAccent, true)}
          </div>
        )}
      </>
    );
  }

  // Variant J — Prism Holographic (rainbow shimmer)
  if (variant === "j") {
    const prism = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 18], [0, 1], EO);
      const sc = ci(localF, [0, 24], [1.2, 1], EO);
      const ty = ci(localF, [0, 22], [40, 0], EO);
      const shimmerPos = (localF * 3) % 200;
      return (
        <div style={{
          opacity: op,
          transform: `scale(${sc}) translateY(${ty}px)`,
          fontFamily, fontSize: size, fontWeight: 700,
          background: `linear-gradient(110deg,
            #ff006e 0%, #00f5ff 20%, #ffd700 35%, #ff00ff 50%,
            #00ff88 65%, #ff006e 80%, #00f5ff 100%)`,
          backgroundSize: "200% 100%",
          backgroundPosition: `${shimmerPos}% 0`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -1, lineHeight: 1.0,
          filter: `drop-shadow(0 0 30px ${colorAccent}) drop-shadow(0 0 60px #ff006e88)`,
        }}>
          {text.toUpperCase()}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {prism(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {prism(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant K — Motion Design (kinetic with rotating accent shape behind)
  if (variant === "k") {
    const motion = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 16], [0, 1], EO);
      const tx = ci(localF, [0, 22], [-200, 0], EO);
      // Geometric reveal — clip-path strip
      const clipR = ci(localF, [0, 26], [100, 0], EO);
      return (
        <div style={{
          opacity: op,
          position: "relative", display: "inline-block",
          transform: `translateX(${tx}px)`,
          clipPath: `inset(0 ${clipR}% 0 0)`,
        }}>
          <div style={{
            fontFamily, fontSize: size, fontWeight: 700,
            color, letterSpacing: -1, lineHeight: 0.95,
            textShadow: shadow,
          }}>
            {text.toUpperCase()}
          </div>
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {motion(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {motion(lines[1], 48, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant L — Cinema Noir (slow scale with anamorphic flare)
  if (variant === "l") {
    const cinema = (text: string, startFrame: number, color: string, shadow: string) => {
      const localF = frame - startFrame;
      const op = ci(localF, [0, 30], [0, 1], EO);
      const sc = ci(localF, [0, 50], [1.15, 1], EI);
      const blur = ci(localF, [0, 30], [8, 0], EO);
      const trackingIn = ci(localF, [0, 40], [20, 0], EO); // letter spacing tightens
      return (
        <div style={{
          opacity: op,
          transform: `scale(${sc})`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          fontFamily, fontSize: size, fontWeight: 700,
          color, letterSpacing: trackingIn, lineHeight: 1.0,
          textShadow: shadow,
        }}>
          {text.toUpperCase()}
        </div>
      );
    };
    return (
      <>
        <div style={{ opacity: line1Op }}>
          {cinema(lines[0] || "", 30, colorPrimary, shadowMain)}
        </div>
        {lines[1] && (
          <div style={{ opacity: line2Op, marginTop: 4 }}>
            {cinema(lines[1], 50, colorAccent, shadowAccent)}
          </div>
        )}
      </>
    );
  }

  // Variant C — Big zoom-blur reveal (whole line at once)
  const reveal = (text: string, startFrame: number, color: string, shadow: string) => {
    const localF = frame - startFrame;
    const op = ci(localF, [0, 18], [0, 1], EO);
    const sc = ci(localF, [0, 26], [2.0, 1], EO);
    const blur = ci(localF, [0, 22], [30, 0], EO);
    const skew = ci(localF, [0, 22], [-8, 0], EO);
    return (
      <div style={{
        opacity: op,
        transform: `scale(${sc}) skewX(${skew}deg)`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        fontFamily, fontSize: size, fontWeight: 700,
        color, letterSpacing: -1, lineHeight: 1.0,
        textShadow: shadow,
      }}>
        {text.toUpperCase()}
      </div>
    );
  };
  return (
    <>
      <div style={{ opacity: line1Op }}>
        {reveal(lines[0] || "", 30, colorPrimary, shadowMain)}
      </div>
      {lines[1] && (
        <div style={{ opacity: line2Op, marginTop: 4 }}>
          {reveal(lines[1], 48, colorAccent, shadowAccent)}
        </div>
      )}
    </>
  );
};

// ─── SCENE 1 — Hero (0–4s) ─────────────────────────────────
const SceneHero = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 0, END = 120;
  if (frame >= END) return null;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const heroOp = ci(frame, [0, 24], [0, 1], EO);
  const heroSc = ci(frame, [0, END], [1.18, 1.0], EI);
  const heroPan = ci(frame, [0, END], [0, vertical ? 0 : -40], EI);

  const flashOp = ci(frame, [22, 32], [0, 1], EO) * ci(frame, [32, 50], [1, 0], EIN);

  const shakeStart = 30;
  const shake = useShake(Math.max(0, frame - shakeStart), 14, 25);

  const lines = c.headline.split("\n");
  const lineOp1 = ci(frame, [30, 50], [0, 1], EO);
  const lineOp2 = ci(frame, [44, 64], [0, 1], EO);

  const accentLineW = ci(frame, [70, 95], [0, vertical ? 500 : 380], EO);
  const subOp = ci(frame, [82, 102], [0, 1], EO);
  const subY  = ci(frame, [82, 102], [20, 0], EO);

  const exit = ci(frame, [END - 16, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{ background: "#000", opacity: exit }}>
      {/* Hero photo with parallax + zoom */}
      {c.assets.hero && (
        <AbsoluteFill style={{
          opacity: heroOp,
          transform: `scale(${heroSc}) translate(${heroPan + shake.x}px, ${shake.y}px)`,
        }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "contrast(1.1) saturate(1.2)",
          }} />
        </AbsoluteFill>
      )}

      {/* Heavy vignette + bottom gradient */}
      <AbsoluteFill style={{
        background: vertical
          ? `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.95) 100%)`
          : `linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)`,
      }} />
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.8) 100%)`,
      }} />

      <LightRays frame={frame} color={c.design.accent} />
      <Bokeh frame={frame} w={W} h={H} count={vertical ? 60 : 50} color={c.design.accent} />

      {/* White flash on impact */}
      <AbsoluteFill style={{
        background: c.design.white, opacity: flashOp * 0.6, mixBlendMode: "screen",
      }} />

      {/* Slogan top */}
      <div style={{
        position: "absolute",
        top: vertical ? 140 : 100,
        left: 0, right: 0,
        textAlign: "center",
        opacity: ci(frame, [12, 32], [0, 1], EO),
        transform: `translateY(${ci(frame, [12, 32], [-40, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700, fontSize: vertical ? 26 : 22,
          color: c.design.accent, letterSpacing: 8,
          textTransform: "uppercase",
          textShadow: `0 0 20px ${c.design.accent}`,
        }}>
          {c.unternehmen.name}
        </div>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 56 : 44,
          color: c.design.white, marginTop: 6,
          textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}>
          {c.unternehmen.slogan}
        </div>
      </div>

      {/* Headline — variant-driven reveal */}
      <div style={{
        position: "absolute",
        top: vertical ? 1180 : 350,
        left: 0, right: 0,
        textAlign: "center",
        padding: "0 60px",
        transform: `translate(${shake.x * 0.4}px, ${shake.y * 0.4}px)`,
      }}>
        <RevealedHeadline
          variant={c.variant ?? "a"}
          frame={frame}
          lines={lines}
          fontFamily={HEAD}
          size={vertical ? 110 : 130}
          colorPrimary={c.design.white}
          colorAccent={c.design.accent}
          line1Op={lineOp1} line2Op={lineOp2}
        />
        {/* Glow line */}
        <div style={{
          width: accentLineW, height: 5,
          background: `linear-gradient(90deg, transparent, ${c.design.accent}, transparent)`,
          margin: "30px auto 0",
          boxShadow: `0 0 20px ${c.design.accent}`,
        }} />
        <div style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontFamily: BODY, fontWeight: 500,
          fontSize: vertical ? 32 : 28,
          color: c.design.white,
          marginTop: 22, lineHeight: 1.4,
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}>
          {c.subheadline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — Vorteile — Variant Switch ──────────────────
const SceneVorteile = (props: { frame: number; c: AdConfig; vertical: boolean }) => {
  const v = props.c.variant ?? "a";
  if (v === "b") return <SceneVorteileB {...props} />;
  if (v === "c") return <SceneVorteileC {...props} />;
  if (v === "d") return <SceneVorteileD {...props} />;
  if (v === "e") return <SceneVorteileE {...props} />;
  if (v === "f") return <SceneVorteileF {...props} />;
  if (v === "g") return <SceneVorteileG {...props} />;
  if (v === "h") return <SceneVorteileH {...props} />;
  if (v === "i") return <SceneVorteileI {...props} />;
  if (v === "j") return <SceneVorteileJ {...props} />;
  if (v === "k") return <SceneVorteileK {...props} />;
  if (v === "l") return <SceneVorteileL {...props} />;
  return <SceneVorteileA {...props} />;
};

// ─── Variant A — 3 cards (das was du schon kennst) ─────────
const SceneVorteileA = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  const headOp = ci(f, [4, 24], [0, 1], EO);
  const headY  = ci(f, [4, 26], [40, 0], EO);

  // Camera shake on first reveal
  const shake = useShake(f, 8, 30);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 60%, ${c.design.primary} 0%, #000 75%)`,
      opacity: bgOp * exit,
    }}>
      {/* Diagonal stripes */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.08 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            top: -200, bottom: -200,
            left: `${i * 12 - 20}%`,
            width: 4,
            background: c.design.accent,
            transform: "rotate(15deg)",
          }} />
        ))}
      </AbsoluteFill>

      <LightRays frame={frame} color={c.design.accent} angle={20} />
      <Bokeh frame={frame} w={W} h={H} count={30} color={c.design.accent} />

      <div style={{
        position: "absolute",
        top: vertical ? 200 : 110,
        left: 0, right: 0, textAlign: "center",
        opacity: headOp,
        transform: `translate(${shake.x}px, ${headY + shake.y}px)`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 96,
          color: c.design.white, letterSpacing: 2,
          lineHeight: 1, textTransform: "uppercase",
          textShadow: `0 0 50px ${c.design.accent}aa`,
        }}>
          {(c.vorteile_label ?? "Ihre Vorteile").split(" ").slice(0, -1).join(" ") || "Ihre"}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 160 : 130,
          background: `linear-gradient(180deg, ${c.design.white} 0%, ${c.design.accent} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 2, lineHeight: 1, marginTop: 2,
          textTransform: "uppercase",
          filter: `drop-shadow(0 0 60px ${c.design.accent}aa)`,
        }}>
          {(c.vorteile_label ?? "Ihre Vorteile").split(" ").slice(-1)[0] || "Vorteile"}
        </div>
      </div>

      {/* Cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 480,
        left: vertical ? 60 : 100,
        right: vertical ? 60 : 100,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 28 : 36,
        justifyContent: "center",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 26 + i * 16;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 26], [80, 0], EO);
          const sc = ci(f, [sStart, sStart + 30], [0.7, 1], POP);
          const rot = ci(f, [sStart, sStart + 30], [vertical ? -3 : -8, 0], EO);
          // Local hover-glow pulse after entry
          const glowF = Math.max(0, f - sStart - 20);
          const glow = 30 + Math.sin(glowF * 0.1) * 10;

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc}) rotate(${rot}deg)`,
              flex: 1,
              padding: vertical ? "30px 32px" : "44px 28px",
              background: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)`,
              backdropFilter: "blur(10px)",
              border: `2px solid ${c.design.accent}`,
              borderRadius: 16,
              boxShadow: `0 0 ${glow}px ${c.design.accent}66, 0 16px 40px rgba(0,0,0,0.6), inset 0 0 30px rgba(255,255,255,0.04)`,
              display: "flex",
              flexDirection: vertical ? "row" : "column",
              alignItems: "center",
              gap: vertical ? 24 : 0,
              textAlign: vertical ? "left" : "center",
            }}>
              <div style={{
                width: vertical ? 90 : 84, height: vertical ? 90 : 84,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${c.design.accent} 0%, ${c.design.primary} 100%)`,
                margin: vertical ? 0 : "0 auto 18px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: HEAD, fontSize: vertical ? 48 : 42, fontWeight: 700,
                color: c.design.white, flexShrink: 0,
                boxShadow: `0 0 30px ${c.design.accent}, inset 0 0 20px rgba(0,0,0,0.3)`,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 44 : 32,
                  color: c.design.white, letterSpacing: 0.5,
                  lineHeight: 1.0, marginBottom: 8,
                  textShadow: `0 0 20px ${c.design.accent}77`,
                }}>
                  {v.titel.toUpperCase()}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 400,
                    fontSize: vertical ? 24 : 20,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.4,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant B — Manifesto: jeder Vorteil bildschirmfüllend ───
const SceneVorteileB = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;
  const totalDur = END - START;
  const slotDur = Math.floor((totalDur - 10) / c.vorteile.length);

  const exit = ci(f, [totalDur - 16, totalDur], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: ci(f, [0, 14], [0, 1], EO) * exit,
    }}>
      <Bokeh frame={frame} w={W} h={H} count={50} color={c.design.accent} />
      <LightRays frame={frame} color={c.design.accent} angle={-15} />

      {c.vorteile.map((v, i) => {
        const localStart = i * slotDur;
        const localEnd = (i + 1) * slotDur;
        if (f < localStart || f >= localEnd) return null;
        const lf = f - localStart;
        const numOp = ci(lf, [0, 12], [0, 1], EO);
        const numSc = ci(lf, [0, 16], [3, 1], EO);
        const numBlur = ci(lf, [0, 12], [20, 0], EO);
        const titleOp = ci(lf, [10, 26], [0, 1], EO);
        const titleY  = ci(lf, [10, 28], [60, 0], EO);
        const descOp  = ci(lf, [22, 38], [0, 1], EO);
        const fadeOut = ci(lf, [slotDur - 8, slotDur], [1, 0], EIN);

        return (
          <div key={i} style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 24, padding: "0 80px", textAlign: "center",
            opacity: fadeOut,
          }}>
            <div style={{
              opacity: numOp,
              transform: `scale(${numSc})`,
              filter: numBlur > 0.3 ? `blur(${numBlur}px)` : undefined,
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 280 : 360,
              background: `linear-gradient(180deg, ${c.design.white} 0%, ${c.design.accent} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 0.8,
              filter: `drop-shadow(0 0 60px ${c.design.accent}aa)`,
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{
              opacity: titleOp,
              transform: `translateY(${titleY}px)`,
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 100 : 120,
              color: c.design.white, lineHeight: 1.0,
              letterSpacing: 1, textTransform: "uppercase",
              textShadow: `0 0 50px ${c.design.accent}`,
            }}>
              {v.titel}
            </div>
            {v.beschreibung && (
              <div style={{
                opacity: descOp,
                fontFamily: BODY, fontWeight: 500,
                fontSize: vertical ? 36 : 40,
                color: "rgba(255,255,255,0.85)",
                maxWidth: 1200, lineHeight: 1.3,
              }}>
                {v.beschreibung}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Variant C — Split-screen mit großen Icons & Stripes ──────
const SceneVorteileC = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const labelText = (c.vorteile_label ?? "DAS MACHT UNS AUS").toUpperCase();

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, #000 0%, ${c.design.primary} 100%)`,
      opacity: bgOp * exit,
    }}>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Big rotated label */}
      <div style={{
        position: "absolute",
        top: vertical ? 100 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [4, 22], [0, 1], EO),
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 24 : 22,
          color: c.design.accent, letterSpacing: 10,
          marginBottom: 10,
          textShadow: `0 0 20px ${c.design.accent}`,
        }}>
          ▸ {labelText} ◂
        </div>
      </div>

      {/* Stripes (one per Vorteil) */}
      <div style={{
        position: "absolute",
        top: vertical ? 220 : 200,
        bottom: 80, left: 0, right: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 0,
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 16 + i * 18;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const tx = ci(f, [sStart, sStart + 28], [vertical ? -200 : -300, 0], EO);
          const stripeW = ci(f, [sStart + 6, sStart + 30], [0, 1], EO);
          const isAlt = i % 2 === 1;
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateX(${tx}px)`,
              display: "flex",
              flexDirection: isAlt ? "row-reverse" : "row",
              alignItems: "center",
              padding: vertical ? "26px 50px" : "30px 80px",
              background: isAlt
                ? `linear-gradient(${isAlt ? 270 : 90}deg, ${c.design.accent}33 0%, transparent 70%)`
                : `linear-gradient(90deg, ${c.design.accent}33 0%, transparent 70%)`,
              borderTop: i === 0 ? `2px solid ${c.design.accent}55` : "none",
              borderBottom: `2px solid ${c.design.accent}55`,
              gap: vertical ? 30 : 50,
            }}>
              {/* Big number */}
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 130 : 180,
                background: `linear-gradient(180deg, ${c.design.accent} 0%, ${c.design.primaryLt} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: 0.85,
                letterSpacing: -2,
                filter: `drop-shadow(0 0 30px ${c.design.accent}aa)`,
                flexShrink: 0, minWidth: vertical ? 140 : 200,
                textAlign: isAlt ? "right" : "left",
              }}>
                0{i + 1}
              </div>
              {/* Animated divider line */}
              <div style={{
                width: 4, height: vertical ? 90 : 110,
                background: c.design.accent,
                transform: `scaleY(${stripeW})`,
                boxShadow: `0 0 20px ${c.design.accent}`,
                flexShrink: 0,
              }} />
              {/* Text */}
              <div style={{
                flex: 1, textAlign: isAlt ? "right" : "left",
              }}>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 56 : 72,
                  color: c.design.white,
                  letterSpacing: 0.5, lineHeight: 1.0,
                  textShadow: `0 0 30px ${c.design.accent}77`,
                  textTransform: "uppercase",
                }}>
                  {v.titel}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 500,
                    fontSize: vertical ? 24 : 28,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 8, lineHeight: 1.3,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant D — Editorial: massive Watermark-Numbers ────────
const SceneVorteileD = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const labelText = c.vorteile_label ?? "Unser Versprechen";

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, #0a0a0a 0%, ${c.design.primary} 60%, #000 100%)`,
      opacity: bgOp * exit,
    }}>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Editorial section label */}
      <div style={{
        position: "absolute", top: vertical ? 130 : 80,
        left: vertical ? 50 : 100,
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translateX(${ci(f, [4, 26], [-30, 0], EO)}px)`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
        }}>
          <div style={{
            width: ci(f, [4, 30], [0, 80], EO), height: 2,
            background: c.design.accent,
            boxShadow: `0 0 12px ${c.design.accent}`,
          }} />
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 24 : 22,
            color: c.design.accent, letterSpacing: 8,
            textTransform: "uppercase",
          }}>
            {labelText}
          </div>
        </div>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 80 : 96,
          color: c.design.white, lineHeight: 1.0,
          marginTop: 14,
          textShadow: `0 4px 30px rgba(0,0,0,0.6)`,
        }}>
          das macht uns einzigartig.
        </div>
      </div>

      {/* Items list — each with massive watermark number */}
      <div style={{
        position: "absolute",
        top: vertical ? 460 : 320,
        bottom: 80,
        left: 0, right: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "space-around",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 22 + i * 16;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 26], [40, 0], EO);
          const numScale = ci(f, [sStart, sStart + 32], [0.6, 1], EO);
          const isLeft = i % 2 === 0;

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px)`,
              position: "relative",
              padding: vertical ? "0 50px" : "0 100px",
              textAlign: isLeft ? "left" : "right",
            }}>
              {/* Massive watermark number */}
              <div style={{
                position: "absolute",
                top: "50%",
                [isLeft ? "right" : "left"]: vertical ? 50 : 100,
                transform: `translateY(-50%) scale(${numScale})`,
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 280 : 360,
                color: "transparent",
                WebkitTextStroke: `2px ${c.design.accent}88`,
                lineHeight: 0.85,
                pointerEvents: "none",
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ position: "relative", zIndex: 1, maxWidth: vertical ? "75%" : "55%", display: isLeft ? "block" : "inline-block" }}>
                <div style={{
                  fontFamily: BODY, fontWeight: 700,
                  fontSize: vertical ? 22 : 22,
                  color: c.design.accent, letterSpacing: 6,
                  marginBottom: 8,
                }}>
                  ▸ Punkt {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 64 : 80,
                  color: c.design.white, lineHeight: 1.0,
                  letterSpacing: 0.5,
                  textShadow: `0 0 30px ${c.design.accent}77`,
                  textTransform: "uppercase",
                }}>
                  {v.titel}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 500,
                    fontSize: vertical ? 26 : 28,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 10, lineHeight: 1.3,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant E — Broadcast: TV-News Lower-Thirds ─────────────
const SceneVorteileE = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const totalDur = END - START;
  const slotDur = Math.floor((totalDur - 14) / c.vorteile.length);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, #050010 100%)`,
      opacity: bgOp * exit,
    }}>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />
      <LightRays frame={frame} color={c.design.accent} angle={-30} />

      {/* Top news strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: vertical ? 90 : 70,
        background: c.design.accent,
        display: "flex", alignItems: "center", padding: "0 40px",
        opacity: ci(f, [0, 14], [0, 1], EO),
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 36 : 32,
          color: c.design.white, letterSpacing: 8,
        }}>
          ◆ LIVE
        </div>
        <div style={{
          marginLeft: "auto",
          fontFamily: BODY, fontWeight: 600,
          fontSize: vertical ? 28 : 22,
          color: c.design.white, letterSpacing: 4,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
      </div>

      {/* Big screen-fill items, one at a time */}
      {c.vorteile.map((v, i) => {
        const localStart = 14 + i * slotDur;
        const localEnd = 14 + (i + 1) * slotDur;
        if (f < localStart || f >= localEnd) return null;
        const lf = f - localStart;
        const numerOp = ci(lf, [0, 18], [0, 1], EO);
        const numerY  = ci(lf, [0, 22], [80, 0], EO);
        const titleOp = ci(lf, [12, 30], [0, 1], EO);
        const titleX  = ci(lf, [12, 30], [-100, 0], EO);
        const lineW   = ci(lf, [22, 38], [0, vertical ? 600 : 800], EO);
        const fadeOut = ci(lf, [slotDur - 8, slotDur], [1, 0], EIN);

        return (
          <div key={i} style={{
            position: "absolute",
            top: vertical ? 200 : 180,
            bottom: vertical ? 200 : 200,
            left: 0, right: 0,
            opacity: fadeOut,
          }}>
            {/* Big "NEWS-style" big number left */}
            <div style={{
              position: "absolute",
              top: vertical ? 80 : 50,
              left: vertical ? 50 : 100,
              opacity: numerOp,
              transform: `translateY(${numerY}px)`,
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 240 : 320,
              color: c.design.accent, lineHeight: 0.85,
              letterSpacing: -8,
              textShadow: `0 0 40px ${c.design.accent}, 0 6px 30px rgba(0,0,0,0.7)`,
            }}>
              0{i + 1}
            </div>

            {/* Title block right */}
            <div style={{
              position: "absolute",
              bottom: vertical ? 80 : 100,
              left: vertical ? 50 : 100,
              right: vertical ? 50 : 100,
              opacity: titleOp,
              transform: `translateX(${titleX}px)`,
            }}>
              <div style={{
                fontFamily: BODY, fontWeight: 700,
                fontSize: vertical ? 22 : 22,
                color: c.design.accent, letterSpacing: 8,
                marginBottom: 12,
              }}>
                ▸ STÄRKE 0{i + 1}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 96 : 110,
                color: c.design.white, lineHeight: 1.0,
                letterSpacing: 0.5,
                textShadow: `0 0 40px ${c.design.accent}aa, 0 6px 20px rgba(0,0,0,0.7)`,
              }}>
                {v.titel.toUpperCase()}
              </div>
              <div style={{
                width: lineW, height: 4,
                background: c.design.accent,
                boxShadow: `0 0 20px ${c.design.accent}`,
                marginTop: 16, marginBottom: 16,
              }} />
              {v.beschreibung && (
                <div style={{
                  fontFamily: BODY, fontWeight: 500,
                  fontSize: vertical ? 32 : 32,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.3, maxWidth: 1200,
                }}>
                  {v.beschreibung}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Bottom ticker */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: vertical ? 70 : 50,
        background: "rgba(0,0,0,0.7)",
        borderTop: `2px solid ${c.design.accent}`,
        display: "flex", alignItems: "center",
        opacity: ci(f, [0, 20], [0, 1], EO),
        overflow: "hidden",
      }}>
        <div style={{
          paddingLeft: vertical ? 40 : 60,
          paddingRight: 40,
          fontFamily: BODY, fontWeight: 600,
          fontSize: vertical ? 22 : 18,
          color: c.design.white, letterSpacing: 4,
          whiteSpace: "nowrap",
          transform: `translateX(${-((f * 4) % 1500)}px)`,
        }}>
          ◆ {c.unternehmen.slogan} ◆ {c.kontakt.telefon_buero} ◆ {c.kontakt.website} ◆ {c.unternehmen.slogan} ◆ {c.kontakt.telefon_buero} ◆
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant F — Geometric: animated frame + hex grid ────────
const SceneVorteileF = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const labelText = (c.vorteile_label ?? "UNSERE STÄRKEN").toUpperCase();

  // Frame draw: 4 sides drawn sequentially
  const fp1 = ci(f, [4, 18], [0, 1], EO);  // top
  const fp2 = ci(f, [10, 24], [0, 1], EO); // right
  const fp3 = ci(f, [16, 30], [0, 1], EO); // bottom
  const fp4 = ci(f, [22, 36], [0, 1], EO); // left

  const headOp = ci(f, [22, 42], [0, 1], EO);
  const headY  = ci(f, [22, 42], [-30, 0], EO);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: bgOp * exit,
    }}>
      {/* Background hex pattern */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.06 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: 80, height: 92,
            background: c.design.accent,
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }} />
        ))}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Animated frame */}
      <div style={{
        position: "absolute",
        top: vertical ? 100 : 60, bottom: vertical ? 100 : 60,
        left: vertical ? 50 : 100, right: vertical ? 50 : 100,
        pointerEvents: "none",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 4, width: `${fp1 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: `${fp2 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, height: 4, width: `${fp3 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 4, height: `${fp4 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        {/* Corner markers */}
        {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([t, l], i) => (
          <div key={i} style={{
            position: "absolute",
            [t ? "bottom" : "top"]: -8,
            [l ? "right" : "left"]: -8,
            width: 16, height: 16,
            background: c.design.accent,
            opacity: ci(f, [22 + i * 2, 30 + i * 2], [0, 1], EO),
            boxShadow: `0 0 16px ${c.design.accent}`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: "absolute", top: vertical ? 200 : 140,
        left: 0, right: 0, textAlign: "center",
        opacity: headOp,
        transform: `translateY(${headY}px)`,
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 22 : 20,
          color: c.design.accent, letterSpacing: 10,
          marginBottom: 14,
          textShadow: `0 0 16px ${c.design.accent}`,
        }}>
          [ {labelText} ]
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 110,
          color: c.design.white, lineHeight: 1, letterSpacing: 1,
          textShadow: `0 0 50px ${c.design.accent}`,
        }}>
          KOMPETENZ
        </div>
      </div>

      {/* Hex cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 460,
        left: 0, right: 0,
        display: "flex", justifyContent: "center",
        gap: vertical ? 30 : 60,
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        padding: "0 60px",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 38 + i * 16;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const sc = ci(f, [sStart, sStart + 28], [0.5, 1], POP);
          const rot = ci(f, [sStart, sStart + 32], [-30, 0], EO);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${sc}) rotate(${rot}deg)`,
              width: vertical ? 600 : 380,
              height: vertical ? 240 : 380,
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Hexagon border */}
              <div style={{
                position: "absolute", inset: 0,
                background: c.design.accent,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                boxShadow: `0 0 40px ${c.design.accent}`,
              }} />
              <div style={{
                position: "absolute", inset: 4,
                background: `linear-gradient(135deg, #0a0a0a 0%, ${c.design.primary} 100%)`,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }} />
              {/* Content */}
              <div style={{
                position: "relative",
                textAlign: "center", padding: "0 50px",
              }}>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 90 : 72,
                  color: c.design.accent, lineHeight: 1,
                  textShadow: `0 0 30px ${c.design.accent}`,
                  marginBottom: 10,
                }}>
                  0{i + 1}
                </div>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 32 : 28,
                  color: c.design.white,
                  letterSpacing: 0.5, lineHeight: 1.1,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                  {v.titel}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 400,
                    fontSize: vertical ? 22 : 18,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.3,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant G — EXPLOSIVE: shockwave rings + radial particles ───
const SceneVorteileG = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;
  const cx = W / 2, cy = H / 2;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const shake = useShake(f, 14, 30);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 50% 50%, ${c.design.primary} 0%, #000 75%)`,
      opacity: bgOp * exit,
    }}>
      {/* Sun-burst rays from center */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.25 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i * 360) / 32;
          const len = ci(f, [0, 60], [0, 200], EO);
          return (
            <div key={i} style={{
              position: "absolute",
              left: cx, top: cy,
              width: 2,
              height: `${len}%`,
              background: `linear-gradient(180deg, ${c.design.accent} 0%, transparent 100%)`,
              transform: `rotate(${angle}deg) translateY(-50%)`,
              transformOrigin: "0 0",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={50} color={c.design.accent} />

      {/* Title with intense radial shadow */}
      <div style={{
        position: "absolute",
        top: vertical ? 200 : 110,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translate(${shake.x * 0.3}px, ${shake.y * 0.3 + ci(f, [4, 24], [40, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 110,
          color: c.design.white, letterSpacing: 2, lineHeight: 1,
          textShadow: `0 0 30px ${c.design.accent}, 0 0 60px ${c.design.accent}aa, 0 0 100px ${c.design.accent}66`,
          textTransform: "uppercase",
        }}>
          BAHM!
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 70 : 64,
          background: `linear-gradient(180deg, ${c.design.accent} 0%, ${c.design.white} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 6, lineHeight: 1, marginTop: 8,
          textShadow: `0 0 40px ${c.design.accent}aa`,
        }}>
          UNSERE STÄRKEN
        </div>
      </div>

      {/* 3 explosive cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 700 : 480,
        left: 0, right: 0,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        justifyContent: "center",
        gap: vertical ? 24 : 36,
        padding: vertical ? "0 60px" : "0 80px",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 24 + i * 14;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const sc = ci(f, [sStart, sStart + 30], [0.0, 1], POP);
          const rot = ci(f, [sStart, sStart + 30], [-180, 0], EO);
          // Per-card shockwave ring
          const ringSc = ci(f, [sStart, sStart + 40], [0.5, 2.5], EO);
          const ringOp = ci(f, [sStart, sStart + 50], [0.6, 0], EO);

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${sc}) rotate(${rot}deg)`,
              flex: 1, position: "relative",
              padding: vertical ? "32px 24px" : "44px 28px",
              background: `radial-gradient(circle at 50% 30%, ${c.design.accent}aa 0%, ${c.design.primary} 60%, #000 100%)`,
              border: `3px solid ${c.design.accent}`,
              borderRadius: "50%",
              aspectRatio: vertical ? "auto" : "1",
              minHeight: vertical ? 220 : 320,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center",
              boxShadow: `0 0 80px ${c.design.accent}, inset 0 0 40px rgba(255,255,255,0.1)`,
            }}>
              {/* Shockwave ring */}
              <div style={{
                position: "absolute", inset: -20,
                borderRadius: "50%",
                border: `4px solid ${c.design.accent}`,
                transform: `scale(${ringSc})`,
                opacity: ringOp,
                boxShadow: `0 0 40px ${c.design.accent}`,
              }} />
              <div style={{
                fontFamily: HEAD, fontSize: vertical ? 110 : 90, fontWeight: 700,
                color: c.design.white,
                textShadow: `0 0 30px ${c.design.accent}, 0 0 60px ${c.design.accent}88`,
                lineHeight: 0.9, marginBottom: 8,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 32 : 28,
                color: c.design.white,
                letterSpacing: 0.5, lineHeight: 1.1,
                textShadow: `0 0 20px ${c.design.accent}`,
                textTransform: "uppercase",
              }}>
                {v.titel}
              </div>
              {v.beschreibung && (
                <div style={{
                  fontFamily: BODY, fontSize: vertical ? 18 : 14,
                  color: "rgba(255,255,255,0.85)", marginTop: 6,
                  lineHeight: 1.3, padding: "0 12px",
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

// ─── Variant H — LIQUID FLOW: morphing blob shapes ──────────────
const SceneVorteileH = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  // Animated morphing blob border-radius
  const blobR = (seed: number) => {
    const t = f * 0.05 + seed;
    return `${50 + Math.sin(t) * 15}% ${50 + Math.cos(t * 1.2) * 15}% ${50 + Math.sin(t * 0.8) * 15}% ${50 + Math.cos(t * 1.5) * 15}% / ${50 + Math.cos(t) * 15}% ${50 + Math.sin(t * 1.3) * 15}% ${50 + Math.cos(t * 0.9) * 15}% ${50 + Math.sin(t * 1.4) * 15}%`;
  };

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, #1a0a2e 50%, ${c.design.accent}55 100%)`,
      opacity: bgOp * exit,
    }}>
      {/* Floating blobs in background */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const seed = i * 1.3;
          const x = 30 + Math.sin(f * 0.02 + seed) * 30;
          const y = 30 + Math.cos(f * 0.025 + seed) * 30;
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              width: 400, height: 400,
              transform: "translate(-50%, -50%)",
              background: i % 2 === 0 ? c.design.accent : c.design.primary,
              borderRadius: blobR(seed),
              opacity: 0.25,
              filter: "blur(40px)",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={25} color={c.design.accent} />

      {/* Header with script font */}
      <div style={{
        position: "absolute",
        top: vertical ? 200 : 130,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translateY(${ci(f, [4, 24], [30, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 80 : 78,
          color: c.design.accent,
          textShadow: `0 0 30px ${c.design.accent}77`,
          marginBottom: 8,
        }}>
          unsere
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 120,
          color: c.design.white, letterSpacing: 4, lineHeight: 1,
          textShadow: `0 4px 30px rgba(0,0,0,0.6)`,
        }}>
          QUALITÄTEN
        </div>
      </div>

      {/* 3 morphing blob cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 460,
        left: vertical ? 60 : 100, right: vertical ? 60 : 100,
        display: "flex", flexDirection: vertical ? "column" : "row",
        gap: vertical ? 30 : 50, justifyContent: "center",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 22 + i * 16;
          const op = ci(f, [sStart, sStart + 24], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 28], [60, 0], EO);
          const sc = ci(f, [sStart, sStart + 30], [0.85, 1], EO);
          const blobSeed = i * 2;

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              flex: 1, position: "relative",
              padding: vertical ? "44px 32px" : "60px 40px",
              background: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)`,
              backdropFilter: "blur(16px)",
              borderRadius: blobR(blobSeed),
              border: `2px solid rgba(255,255,255,0.15)`,
              boxShadow: `0 20px 60px ${c.design.accent}33, inset 0 0 30px rgba(255,255,255,0.05)`,
              textAlign: "center",
              transition: "border-radius 0.3s",
            }}>
              <div style={{
                width: 80, height: 80,
                borderRadius: blobR(blobSeed + 0.5),
                background: `linear-gradient(135deg, ${c.design.accent}, ${c.design.primary})`,
                margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: HEAD, fontSize: 38, fontWeight: 700,
                color: c.design.white,
                boxShadow: `0 0 40px ${c.design.accent}aa`,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 36 : 32,
                color: c.design.white, lineHeight: 1.1, letterSpacing: 0.5,
                marginBottom: 10, textTransform: "uppercase",
                textShadow: `0 0 20px ${c.design.accent}77`,
              }}>
                {v.titel}
              </div>
              {v.beschreibung && (
                <div style={{
                  fontFamily: BODY, fontWeight: 400,
                  fontSize: vertical ? 22 : 20,
                  color: "rgba(255,255,255,0.85)", lineHeight: 1.4,
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

// ─── Variant I — RETRO SYNTHWAVE: 80s sun + grid + chrome ────
const SceneVorteileI = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  // Grid floor moves
  const gridOffset = (f * 4) % 80;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, #0a0014 0%, ${c.design.primary} 40%, #ff006e 70%, #ff8c00 95%, #ffd700 100%)`,
      opacity: bgOp * exit,
    }}>
      {/* Sun circle */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: vertical ? "30%" : "32%",
        transform: "translate(-50%, -50%)",
        width: vertical ? 700 : 800,
        height: vertical ? 700 : 800,
        borderRadius: "50%",
        background: "linear-gradient(180deg, #ffd700 0%, #ff8c00 50%, #ff006e 100%)",
        boxShadow: "0 0 80px #ff006eaa, 0 0 150px #ffd70055",
        opacity: ci(f, [0, 30], [0, 1], EO),
      }} />

      {/* Sun horizontal stripes (cuts in sun) */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: vertical ? "30%" : "32%",
        transform: "translate(-50%, -50%)",
        width: vertical ? 700 : 800,
        height: vertical ? 700 : 800,
        opacity: 0.85,
      }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: 0, right: 0,
            top: `${10 + i * 8}%`,
            height: `${1 + i * 0.5}px`,
            background: "#0a0014",
          }} />
        ))}
      </div>

      {/* Grid floor */}
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          bottom: 0, left: "-20%", right: "-20%",
          height: "55%",
          background: "linear-gradient(180deg, transparent 0%, #0a0014 80%)",
          backgroundImage: `
            linear-gradient(${c.design.accent}aa 1px, transparent 1px),
            linear-gradient(90deg, ${c.design.accent}aa 1px, transparent 1px)
          `,
          backgroundSize: `80px 80px`,
          backgroundPosition: `0 ${gridOffset}px, ${gridOffset}px 0`,
          transform: "perspective(600px) rotateX(60deg)",
          transformOrigin: "center top",
          maskImage: "linear-gradient(180deg, transparent 0%, black 30%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 30%)",
        }} />
      </AbsoluteFill>

      {/* Title — chrome 3D */}
      <div style={{
        position: "absolute",
        top: vertical ? 200 : 100,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [10, 30], [0, 1], EO),
        transform: `scale(${ci(f, [10, 32], [0.7, 1], EO)})`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 120,
          background: "linear-gradient(180deg, #ffd700 0%, #fff 30%, #ff006e 60%, #00f5ff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 2, lineHeight: 1.0,
          textShadow: `0 0 60px ${c.design.accent}`,
          filter: `drop-shadow(0 4px 0 ${c.design.primary}) drop-shadow(0 8px 0 #000)`,
        }}>
          POWER PACK
        </div>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 26 : 26,
          color: "#00f5ff", letterSpacing: 12,
          textShadow: "0 0 30px #00f5ff",
          marginTop: 12,
        }}>
          ▸ HIGHLIGHTS ◂
        </div>
      </div>

      {/* 3 retro neon panels */}
      <div style={{
        position: "absolute",
        top: vertical ? 1080 : 660,
        left: vertical ? 60 : 100, right: vertical ? 60 : 100,
        display: "flex", flexDirection: vertical ? "column" : "row",
        gap: vertical ? 24 : 30, justifyContent: "center",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 26 + i * 14;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 28], [80, 0], EO);
          const sc = ci(f, [sStart, sStart + 30], [0.8, 1], POP);
          const colors = ["#ff006e", "#00f5ff", "#ffd700"];
          const neonColor = colors[i % colors.length];

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              flex: 1,
              padding: vertical ? "26px 28px" : "32px 30px",
              background: "rgba(10,0,20,0.7)",
              backdropFilter: "blur(8px)",
              border: `3px solid ${neonColor}`,
              borderRadius: 6,
              boxShadow: `0 0 40px ${neonColor}, inset 0 0 30px ${neonColor}33`,
              textAlign: "center",
              position: "relative",
            }}>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 80 : 70,
                color: neonColor, lineHeight: 0.9,
                textShadow: `0 0 30px ${neonColor}, 0 0 60px ${neonColor}77`,
                marginBottom: 10,
              }}>
                0{i + 1}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 32 : 28,
                color: "#fff", letterSpacing: 0.5,
                lineHeight: 1.1, marginBottom: 8,
                textShadow: `0 0 16px ${neonColor}`,
                textTransform: "uppercase",
              }}>
                {v.titel}
              </div>
              {v.beschreibung && (
                <div style={{
                  fontFamily: BODY, fontWeight: 400,
                  fontSize: vertical ? 18 : 16,
                  color: "rgba(255,255,255,0.85)", lineHeight: 1.3,
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

// ─── Variant J — PRISM HOLOGRAPHIC: Diamond cards with rainbow shimmer ─
const SceneVorteileJ = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const shimmer = (f * 2) % 200;

  return (
    <AbsoluteFill style={{
      background: "#050010",
      opacity: bgOp * exit,
    }}>
      {/* Holographic background gradient */}
      <AbsoluteFill style={{
        background: `linear-gradient(${(f * 0.5) % 360}deg,
          #ff006e22 0%, #00f5ff22 25%, #ffd70022 50%, #ff00ff22 75%, #00ff8822 100%)`,
        opacity: 0.6,
      }} />
      {/* Floating prism shapes */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.5 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const seed = i * 1.7;
          const x = 50 + Math.sin(f * 0.02 + seed) * 40;
          const y = 50 + Math.cos(f * 0.025 + seed) * 40;
          const rot = (f * 0.5 + i * 45) % 360;
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              width: 160, height: 160,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              background: `linear-gradient(${i * 45}deg, #ff006e, #00f5ff, #ffd700)`,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              filter: "blur(30px)",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={30} color="#ff006e" />

      {/* Header — holographic */}
      <div style={{
        position: "absolute", top: vertical ? 200 : 120,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translateY(${ci(f, [4, 26], [40, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 110,
          background: `linear-gradient(110deg, #ff006e, #00f5ff, #ffd700, #ff00ff, #ff006e)`,
          backgroundSize: "200% 100%",
          backgroundPosition: `${shimmer}% 0`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 2, lineHeight: 1,
          filter: `drop-shadow(0 0 40px #ff006e) drop-shadow(0 0 80px #00f5ff)`,
        }}>
          PREMIUM
        </div>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 26 : 24,
          color: "#fff", letterSpacing: 16,
          marginTop: 12, opacity: 0.9,
          textShadow: "0 0 20px #ff006e",
        }}>
          ◇  KOMPETENZ  ◇
        </div>
      </div>

      {/* Diamond cards */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 460,
        left: 0, right: 0,
        display: "flex", flexDirection: vertical ? "column" : "row",
        justifyContent: "center", gap: vertical ? 60 : 80,
        padding: "0 80px",
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 22 + i * 18;
          const op = ci(f, [sStart, sStart + 24], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 30], [80, 0], EO);
          const sc = ci(f, [sStart, sStart + 32], [0.6, 1], POP);
          const rot = ci(f, [sStart, sStart + 36], [-30, 0], EO);
          const localShimmer = (f * 2 + i * 60) % 200;

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc}) rotate(${rot}deg)`,
              width: vertical ? 400 : 360,
              height: vertical ? 400 : 360,
              position: "relative",
              flexShrink: 0,
            }}>
              {/* Diamond outer (holographic border) */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(${localShimmer * 1.8}deg, #ff006e, #00f5ff, #ffd700, #ff00ff, #ff006e)`,
                backgroundSize: "200% 200%",
                backgroundPosition: `${localShimmer}% 50%`,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                boxShadow: "0 0 60px #ff006eaa, 0 0 120px #00f5ff66",
              }} />
              {/* Inner */}
              <div style={{
                position: "absolute", inset: 6,
                background: "linear-gradient(135deg, #050010 0%, #1a0a2e 100%)",
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }} />
              {/* Content */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "0 60px",
              }}>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 90 : 70,
                  background: `linear-gradient(180deg, #ff006e, #00f5ff)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  lineHeight: 0.85,
                  filter: `drop-shadow(0 0 20px #ff006e)`,
                }}>
                  0{i + 1}
                </div>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 28 : 24,
                  color: "#fff", letterSpacing: 0.5, lineHeight: 1.1,
                  marginTop: 12, marginBottom: 6,
                  textTransform: "uppercase",
                  textShadow: "0 0 20px #ff006e",
                }}>
                  {v.titel}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 400,
                    fontSize: vertical ? 18 : 14,
                    color: "rgba(255,255,255,0.85)", lineHeight: 1.3,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant K — MOTION DESIGN: Bauhaus geometry + strict grid ────
const SceneVorteileK = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);

  // Big shapes that move independently
  const circleX = ci(f, [0, 36], [-400, 0], EO);
  const circleR = (f * 0.3) % 360;
  const squareY = ci(f, [4, 40], [-400, 0], EO);
  const squareR = (f * -0.4) % 360;
  const triRot = ci(f, [8, 44], [-90, 0], EO);
  const triOp = ci(f, [8, 30], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: "#0a0a0a", // Bauhaus black/dark for poster look
      opacity: bgOp * exit,
    }}>
      {/* Bauhaus grid background (subtle) */}
      <AbsoluteFill style={{
        opacity: 0.04,
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: "100px 100px",
      }} />

      {/* Big rotating circle */}
      <div style={{
        position: "absolute",
        top: vertical ? 100 : 120,
        left: -200, transform: `translateX(${circleX}px) rotate(${circleR}deg)`,
        width: 600, height: 600,
        background: c.design.accent,
        borderRadius: "50%",
        opacity: 0.85,
      }} />

      {/* Big square top right */}
      <div style={{
        position: "absolute",
        top: 0, right: vertical ? -100 : -150,
        transform: `translateY(${squareY}px) rotate(${squareR}deg)`,
        width: 500, height: 500,
        background: "#ffd700",
        opacity: 0.9,
      }} />

      {/* Triangle bottom */}
      <div style={{
        position: "absolute",
        bottom: vertical ? "20%" : "10%",
        right: "10%",
        opacity: triOp,
        transform: `rotate(${triRot}deg)`,
        width: 0, height: 0,
        borderLeft: "200px solid transparent",
        borderRight: "200px solid transparent",
        borderBottom: `350px solid ${c.design.primary}`,
      }} />

      {/* Strict typography */}
      <div style={{
        position: "absolute",
        top: vertical ? 260 : 100,
        left: vertical ? 60 : 100,
        opacity: ci(f, [12, 30], [0, 1], EO),
        transform: `translateX(${ci(f, [12, 32], [-30, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 800,
          fontSize: vertical ? 22 : 22,
          color: "#fff", letterSpacing: 12,
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          ⬢ FEATURED
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 200 : 220,
          color: "#fff", lineHeight: 0.85,
          letterSpacing: -8,
        }}>
          NICE.
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 200 : 220,
          color: c.design.accent, lineHeight: 0.85,
          letterSpacing: -8,
          marginTop: -20,
        }}>
          STRONG.
        </div>
      </div>

      {/* 3 strict-aligned items */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 80 : 80,
        left: vertical ? 60 : 100, right: vertical ? 60 : 100,
        display: "flex", flexDirection: vertical ? "column" : "row",
        gap: vertical ? 20 : 30,
      }}>
        {c.vorteile.map((v, i) => {
          const sStart = 26 + i * 12;
          const op = ci(f, [sStart, sStart + 22], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 26], [40, 0], EO);
          const colors = ["#ffd700", c.design.accent, c.design.primary];
          const fillColor = colors[i % colors.length];

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px)`,
              flex: 1,
              padding: vertical ? "20px 24px" : "26px 30px",
              borderTop: `4px solid ${fillColor}`,
              background: "rgba(255,255,255,0.03)",
              display: "flex", alignItems: "flex-start", gap: 24,
            }}>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 90 : 80,
                color: fillColor, lineHeight: 0.85,
                letterSpacing: -2,
                flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 30 : 26,
                  color: "#fff", letterSpacing: 0.5,
                  lineHeight: 1.1, marginBottom: 6,
                  textTransform: "uppercase",
                }}>
                  {v.titel}
                </div>
                {v.beschreibung && (
                  <div style={{
                    fontFamily: BODY, fontWeight: 400,
                    fontSize: vertical ? 20 : 16,
                    color: "rgba(255,255,255,0.7)", lineHeight: 1.4,
                  }}>
                    {v.beschreibung}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Variant L — CINEMA NOIR: Letterbox + lens flares + grain ─────
const SceneVorteileL = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 120, END = 240;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 18, END - START], [1, 0], EIN);
  const totalDur = END - START;
  const slotDur = Math.floor((totalDur - 14) / c.vorteile.length);

  // Letterbox bars
  const barH = ci(f, [0, 20], [0, 100], EO);

  // Lens flare sweep
  const flareX = ci(f, [10, 100], [-30, 130], EO);

  return (
    <AbsoluteFill style={{
      background: "#0a0a0a",
      opacity: bgOp * exit,
    }}>
      {/* Soft grain overlay using radial-gradient stack */}
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4) 100%)`,
        opacity: 0.5,
      }} />

      {/* Sun-flare horizontal streak */}
      <div style={{
        position: "absolute",
        left: `${flareX}%`,
        top: "30%",
        width: "60%",
        height: 4,
        background: `linear-gradient(90deg, transparent 0%, ${c.design.accent} 50%, transparent 100%)`,
        boxShadow: `0 0 80px ${c.design.accent}, 0 0 200px ${c.design.accent}`,
        opacity: 0.4,
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute",
        left: `${flareX}%`,
        top: "30%",
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: c.design.accent,
        boxShadow: `0 0 120px ${c.design.accent}`,
        opacity: 0.5,
        transform: "translateX(-50%)",
        filter: "blur(20px)",
      }} />

      {/* Letterbox bars */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: `${barH * 1.4}px`, background: "#000",
        zIndex: 10,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: `${barH * 1.4}px`, background: "#000",
        zIndex: 10,
      }} />

      {/* Title */}
      <div style={{
        position: "absolute",
        top: vertical ? 280 : 200,
        left: 0, right: 0, textAlign: "center", padding: "0 80px",
        opacity: ci(f, [16, 36], [0, 1], EO),
        transform: `scale(${ci(f, [16, 50], [1.1, 1], EI)})`,
      }}>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 76 : 70,
          color: c.design.accent,
          textShadow: `0 0 50px ${c.design.accent}`,
          marginBottom: 10,
          letterSpacing: 4,
        }}>
          ein blick auf
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 150 : 140,
          color: "#fff", letterSpacing: -2, lineHeight: 1,
          textShadow: `0 0 60px ${c.design.accent}, 0 4px 30px rgba(0,0,0,0.7)`,
        }}>
          DAS BESTE
        </div>
      </div>

      {/* Items as title cards (one at a time) */}
      {c.vorteile.map((v, i) => {
        const localStart = 50 + i * slotDur * 0.7;
        const localEnd = localStart + slotDur * 0.7;
        if (f < localStart || f >= localEnd) return null;
        const lf = f - localStart;
        const cardOp = ci(lf, [0, 16], [0, 1], EO);
        const cardSc = ci(lf, [0, 40], [1.1, 1], EI);
        const numTrack = ci(lf, [0, 30], [16, 0], EO);
        const cardBlur = ci(lf, [0, 20], [10, 0], EO);
        const cardFadeOut = ci(lf, [slotDur * 0.5, slotDur * 0.7], [1, 0], EIN);

        return (
          <div key={i} style={{
            position: "absolute", inset: 0,
            opacity: cardOp * cardFadeOut,
            transform: `scale(${cardSc})`,
            filter: cardBlur > 0.3 ? `blur(${cardBlur}px)` : undefined,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 80px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: HEAD, fontSize: vertical ? 360 : 480,
              color: "transparent",
              WebkitTextStroke: `2px ${c.design.accent}aa`,
              lineHeight: 0.85, letterSpacing: numTrack,
              fontWeight: 700,
              filter: `drop-shadow(0 0 40px ${c.design.accent}77)`,
              marginBottom: -100,
            }}>
              0{i + 1}
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 90 : 110,
              color: "#fff", lineHeight: 1.0,
              letterSpacing: -1,
              textShadow: `0 0 50px ${c.design.accent}, 0 4px 30px rgba(0,0,0,0.8)`,
              textTransform: "uppercase",
              marginTop: 0, marginBottom: 16,
            }}>
              {v.titel}
            </div>
            {v.beschreibung && (
              <div style={{
                fontFamily: BODY, fontWeight: 500,
                fontSize: vertical ? 32 : 32,
                color: "rgba(255,255,255,0.85)", lineHeight: 1.3,
                fontStyle: "italic",
                maxWidth: 1200,
              }}>
                "{v.beschreibung}"
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── SCENE 3 — Massive CTA ─────────────────────────────────
const SceneCTA = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 240, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 12], [0, 1], EO);
  const exit = ci(f, [END - START - 16, END - START], [1, 0], EIN);

  const kickerOp = ci(f, [4, 22], [0, 1], EO);
  const kickerY  = ci(f, [4, 24], [-30, 0], EO);

  const ctaOp = ci(f, [16, 38], [0, 1], EO);
  const ctaSc = ci(f, [16, 42], [0.5, 1], POP);

  const shake = useShake(Math.max(0, f - 16), 16, 22);
  const pulse = f >= 50 ? 1 + Math.sin((f - 50) * 0.18) * 0.04 : 1;
  const glow = 40 + Math.sin(f * 0.16) * 25;

  const phoneOp = ci(f, [44, 64], [0, 1], EO);
  const phoneY  = ci(f, [44, 64], [40, 0], EO);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 32, padding: "0 60px",
    }}>
      <Bokeh frame={frame} w={W} h={H} count={40} color={c.design.accent} />
      <LightRays frame={frame} color={c.design.accent} angle={-20} />

      {/* Pulsing red bg */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, ${c.design.accent}55 0%, transparent 50%)`,
        opacity: 0.4 + Math.sin(f * 0.12) * 0.2,
      }} />

      <div style={{
        opacity: kickerOp,
        transform: `translateY(${kickerY}px)`,
        fontFamily: BODY, fontWeight: 700,
        fontSize: vertical ? 32 : 30,
        color: c.design.white, letterSpacing: 12,
        textTransform: "uppercase",
        textShadow: `0 0 30px ${c.design.accent}`,
        textAlign: "center",
      }}>
        ▸ {c.cta.kicker} ◂
      </div>

      <div style={{
        opacity: ctaOp,
        transform: `scale(${ctaSc * pulse}) translate(${shake.x}px, ${shake.y}px)`,
        background: `linear-gradient(135deg, ${c.design.accent} 0%, ${c.design.primary} 200%)`,
        padding: vertical ? "40px 48px" : "32px 80px",
        borderRadius: 16,
        border: `4px solid rgba(255,255,255,0.25)`,
        boxShadow: `0 0 ${glow}px ${c.design.accent}, 0 30px 80px rgba(0,0,0,0.7), inset 0 0 30px rgba(255,255,255,0.1)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 76 : 86,
          color: c.design.white,
          letterSpacing: 1.5, lineHeight: 1.05,
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          {c.cta.text.toUpperCase()}
        </div>
      </div>

      <div style={{
        opacity: phoneOp,
        transform: `translateY(${phoneY}px)`,
        marginTop: 24, textAlign: "center",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 24 : 22,
          color: c.design.accent, letterSpacing: 6,
          marginBottom: 10,
        }}>
          ☎ ANRUFEN
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 96 : 86,
          color: c.design.white, letterSpacing: 2,
          lineHeight: 1,
          textShadow: `0 0 30px ${c.design.accent}`,
        }}>
          {c.kontakt.telefon_buero}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4 — Final: Vollbild-Kontakt für Terminals ───────
// Massive, lesbare Adresse + Telefon + Website hervorgehoben.
// Variant-abhängig: andere Layouts.
const SceneFinal = (props: { frame: number; c: AdConfig; vertical: boolean }) => {
  const v = props.c.variant ?? "a";
  if (v === "b") return <SceneFinalB {...props} />;
  if (v === "c") return <SceneFinalC {...props} />;
  if (v === "d") return <SceneFinalD {...props} />;
  if (v === "e") return <SceneFinalE {...props} />;
  if (v === "f") return <SceneFinalF {...props} />;
  if (v === "g") return <SceneFinalG {...props} />;
  if (v === "h") return <SceneFinalH {...props} />;
  if (v === "i") return <SceneFinalI {...props} />;
  if (v === "j") return <SceneFinalJ {...props} />;
  if (v === "k") return <SceneFinalK {...props} />;
  if (v === "l") return <SceneFinalL {...props} />;
  return <SceneFinalA {...props} />;
};

// ── Final A — Big Phone hero + Address card ──────────────
const SceneFinalA = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  // Brand top
  const nameOp = ci(f, [4, 24], [0, 1], EO);
  const nameY  = ci(f, [4, 26], [-30, 0], EO);

  // Phone mega
  const phoneOp = ci(f, [18, 38], [0, 1], EO);
  const phoneSc = ci(f, [18, 42], [0.6, 1], POP);

  // Address card
  const addrOp = ci(f, [34, 54], [0, 1], EO);
  const addrTx = ci(f, [34, 54], [-80, 0], EO);

  // Web/Email
  const webOp = ci(f, [50, 70], [0, 1], EO);

  const phonePulse = f >= 50 ? 1 + Math.sin((f - 50) * 0.16) * 0.025 : 1;
  const phoneGlow  = 40 + Math.sin(f * 0.16) * 22;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, #000 100%)`,
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.18 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(18px) brightness(0.4) saturate(1.3)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.12], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <Bokeh frame={frame} w={W} h={H} count={30} color={c.design.accent} />

      {/* Brand name top */}
      <div style={{
        position: "absolute", top: vertical ? 100 : 70,
        left: 0, right: 0, textAlign: "center",
        opacity: nameOp,
        transform: `translateY(${nameY}px)`,
        padding: "0 40px",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 64 : 72,
          color: c.design.white, letterSpacing: 1, lineHeight: 1.0,
          textShadow: `0 0 40px ${c.design.accent}aa`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        {c.unternehmen.slogan && (
          <div style={{
            fontFamily: SCRIPT, fontSize: vertical ? 56 : 52,
            color: c.design.accent, marginTop: 4,
            textShadow: `0 0 30px ${c.design.accent}aa`,
          }}>
            {c.unternehmen.slogan}
          </div>
        )}
      </div>

      {/* MEGA PHONE — focus point */}
      <div style={{
        position: "absolute",
        top: vertical ? 350 : 240,
        left: 0, right: 0,
        opacity: phoneOp,
        transform: `scale(${phoneSc * phonePulse})`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 30 : 32,
          color: c.design.accent, letterSpacing: 12,
          marginBottom: 14,
          textShadow: `0 0 30px ${c.design.accent}`,
        }}>
          ☎  JETZT ANRUFEN
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 140 : 200,
          color: c.design.white,
          letterSpacing: 4, lineHeight: 1,
          textShadow: `0 0 ${phoneGlow}px ${c.design.accent}, 0 0 ${phoneGlow * 1.5}px ${c.design.accent}77, 0 6px 30px rgba(0,0,0,0.8)`,
        }}>
          {c.kontakt.telefon_buero}
        </div>
      </div>

      {/* ADDRESS card — big readable */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 560,
        left: vertical ? 60 : "10%",
        right: vertical ? 60 : "10%",
        opacity: addrOp,
        transform: `translateX(${addrTx}px)`,
      }}>
        <div style={{
          padding: vertical ? "30px 36px" : "36px 56px",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(10px)",
          border: `3px solid ${c.design.accent}`,
          borderRadius: 18,
          boxShadow: `0 0 60px ${c.design.accent}66, inset 0 0 30px rgba(255,255,255,0.04)`,
          display: "flex",
          alignItems: "center",
          gap: vertical ? 24 : 36,
        }}>
          <div style={{
            width: vertical ? 100 : 120,
            height: vertical ? 100 : 120,
            borderRadius: "50%",
            background: c.design.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: vertical ? 56 : 70, flexShrink: 0,
            boxShadow: `0 0 40px ${c.design.accent}`,
          }}>
            📍
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: BODY, fontWeight: 700,
              fontSize: vertical ? 22 : 22,
              color: c.design.accent, letterSpacing: 6,
              marginBottom: 6,
            }}>
              BESUCHEN SIE UNS
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 50 : 60,
              color: c.design.white, lineHeight: 1.1,
              letterSpacing: 0.5,
              textShadow: `0 0 20px ${c.design.accent}77`,
            }}>
              {c.kontakt.adresse_zeile1}
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 600,
              fontSize: vertical ? 44 : 52,
              color: c.design.white,
              opacity: 0.9, lineHeight: 1.1,
              marginTop: 2,
            }}>
              {c.kontakt.adresse_zeile2}
            </div>
          </div>
        </div>
      </div>

      {/* Web + Email row */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 100 : 70,
        left: 0, right: 0,
        opacity: webOp,
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{
          display: "inline-flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          gap: vertical ? 14 : 50,
        }}>
          {c.kontakt.website && (
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 40 : 46,
              color: c.design.white,
              letterSpacing: 1,
              textShadow: `0 0 20px ${c.design.accent}aa`,
            }}>
              <span style={{ color: c.design.accent }}>🌐</span> {c.kontakt.website}
            </div>
          )}
          {c.kontakt.email && (
            <div style={{
              fontFamily: BODY, fontWeight: 600,
              fontSize: vertical ? 30 : 36,
              color: "rgba(255,255,255,0.9)",
            }}>
              <span style={{ color: c.design.accent }}>✉</span> {c.kontakt.email}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Final B — Split Layout: Phone left, Info right ────────
const SceneFinalB = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const leftOp = ci(f, [4, 28], [0, 1], EO);
  const leftTx = ci(f, [4, 32], [-100, 0], EO);
  const rightOp = ci(f, [18, 42], [0, 1], EO);
  const rightTx = ci(f, [18, 42], [100, 0], EO);

  const phonePulse = 1 + Math.sin(f * 0.16) * 0.03;
  const phoneGlow  = 40 + Math.sin(f * 0.16) * 22;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(90deg, #000 0%, ${c.design.primary} 60%, #000 100%)`,
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.15 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(20px) brightness(0.4) saturate(1.4)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.1], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <Bokeh frame={frame} w={W} h={H} count={25} color={c.design.accent} />

      {/* Brand name top center */}
      <div style={{
        position: "absolute", top: vertical ? 90 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [0, 20], [0, 1], EO),
        transform: `translateY(${ci(f, [0, 24], [-20, 0], EO)}px)`,
        padding: "0 40px",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 58 : 64,
          color: c.design.white, letterSpacing: 1,
          textShadow: `0 0 30px ${c.design.accent}aa`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        {c.unternehmen.slogan && (
          <div style={{
            fontFamily: SCRIPT, fontSize: vertical ? 50 : 50,
            color: c.design.accent, marginTop: 4,
            textShadow: `0 0 20px ${c.design.accent}`,
          }}>
            {c.unternehmen.slogan}
          </div>
        )}
      </div>

      <div style={{
        position: "absolute",
        top: vertical ? 320 : 230,
        bottom: vertical ? 180 : 130,
        left: 0, right: 0,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 30 : 60,
        padding: vertical ? "0 50px" : "0 80px",
      }}>
        {/* LEFT: Phone */}
        <div style={{
          flex: 1,
          opacity: leftOp,
          transform: `translateX(${leftTx}px) scale(${phonePulse})`,
          background: `linear-gradient(135deg, ${c.design.accent} 0%, ${c.design.primary} 200%)`,
          borderRadius: 22,
          padding: vertical ? "40px 30px" : "60px 50px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${phoneGlow}px ${c.design.accent}, 0 30px 80px rgba(0,0,0,0.7)`,
          border: `4px solid rgba(255,255,255,0.2)`,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: vertical ? 80 : 110,
            marginBottom: 14,
          }}>📞</div>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 26 : 30,
            color: c.design.white, letterSpacing: 8,
            marginBottom: 16,
            textShadow: "0 0 16px rgba(0,0,0,0.4)",
          }}>
            ANRUFEN
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 80 : 110,
            color: c.design.white, lineHeight: 1,
            letterSpacing: 2,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>

        {/* RIGHT: Info stack */}
        <div style={{
          flex: 1,
          opacity: rightOp,
          transform: `translateX(${rightTx}px)`,
          display: "flex", flexDirection: "column",
          gap: vertical ? 18 : 28, justifyContent: "center",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
            padding: vertical ? "20px 26px" : "26px 36px",
            borderRadius: 14,
            border: `3px solid ${c.design.accent}`,
            boxShadow: `0 0 30px ${c.design.accent}55`,
            display: "flex", alignItems: "center", gap: 22,
          }}>
            <div style={{
              fontSize: vertical ? 48 : 60,
              color: c.design.accent,
              flexShrink: 0,
            }}>📍</div>
            <div>
              <div style={{
                fontFamily: BODY, fontWeight: 700, fontSize: 18,
                color: c.design.accent, letterSpacing: 4, marginBottom: 4,
              }}>
                ADRESSE
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 700,
                fontSize: vertical ? 38 : 44,
                color: c.design.white, lineHeight: 1.1,
              }}>
                {c.kontakt.adresse_zeile1}
              </div>
              <div style={{
                fontFamily: HEAD, fontWeight: 600,
                fontSize: vertical ? 30 : 36,
                color: "rgba(255,255,255,0.9)",
              }}>
                {c.kontakt.adresse_zeile2}
              </div>
            </div>
          </div>

          {c.kontakt.website && (
            <div style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              padding: vertical ? "20px 26px" : "24px 36px",
              borderRadius: 14,
              border: `3px solid ${c.design.accent}`,
              boxShadow: `0 0 30px ${c.design.accent}55`,
              display: "flex", alignItems: "center", gap: 22,
            }}>
              <div style={{
                fontSize: vertical ? 44 : 56,
                color: c.design.accent, flexShrink: 0,
              }}>🌐</div>
              <div>
                <div style={{
                  fontFamily: BODY, fontWeight: 700, fontSize: 18,
                  color: c.design.accent, letterSpacing: 4, marginBottom: 4,
                }}>
                  WEBSITE
                </div>
                <div style={{
                  fontFamily: HEAD, fontWeight: 700,
                  fontSize: vertical ? 36 : 44,
                  color: c.design.white,
                }}>
                  {c.kontakt.website}
                </div>
              </div>
            </div>
          )}

          {c.kontakt.email && (
            <div style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              padding: vertical ? "16px 26px" : "20px 36px",
              borderRadius: 14,
              border: `3px solid ${c.design.accent}`,
              boxShadow: `0 0 30px ${c.design.accent}55`,
              display: "flex", alignItems: "center", gap: 22,
            }}>
              <div style={{
                fontSize: vertical ? 38 : 48,
                color: c.design.accent, flexShrink: 0,
              }}>✉</div>
              <div>
                <div style={{
                  fontFamily: BODY, fontWeight: 700, fontSize: 16,
                  color: c.design.accent, letterSpacing: 4, marginBottom: 2,
                }}>
                  E-MAIL
                </div>
                <div style={{
                  fontFamily: HEAD, fontWeight: 600,
                  fontSize: vertical ? 28 : 34,
                  color: c.design.white,
                }}>
                  {c.kontakt.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Final C — Centered Stack with Mega Address ────────────
const SceneFinalC = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);

  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const nameOp = ci(f, [4, 28], [0, 1], EO);
  const nameSc = ci(f, [4, 32], [1.4, 1], EO);
  const nameBlur = ci(f, [4, 28], [16, 0], EO);

  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const phoneTx = ci(f, [22, 44], [-60, 0], EO);

  const addrOp = ci(f, [40, 60], [0, 1], EO);
  const addrTx = ci(f, [40, 60], [60, 0], EO);

  const webOp = ci(f, [56, 76], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.2 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(16px) brightness(0.4) saturate(1.3)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.12], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <Bokeh frame={frame} w={W} h={H} count={35} color={c.design.accent} />
      <LightRays frame={frame} color={c.design.accent} angle={20} />

      {/* Brand reveal — explosive */}
      <div style={{
        position: "absolute",
        top: vertical ? 140 : 80,
        left: 0, right: 0, textAlign: "center",
        padding: "0 40px",
      }}>
        <div style={{
          opacity: nameOp,
          transform: `scale(${nameSc})`,
          filter: nameBlur > 0.3 ? `blur(${nameBlur}px)` : undefined,
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 78 : 88,
          color: c.design.white, letterSpacing: 1, lineHeight: 1.0,
          textShadow: `0 0 60px ${c.design.accent}, 0 6px 30px rgba(0,0,0,0.8)`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        {c.unternehmen.slogan && (
          <div style={{
            opacity: ci(f, [22, 42], [0, 1], EO),
            fontFamily: SCRIPT, fontSize: vertical ? 60 : 60,
            color: c.design.accent, marginTop: 8,
            textShadow: `0 0 30px ${c.design.accent}`,
          }}>
            {c.unternehmen.slogan}
          </div>
        )}
      </div>

      {/* Phone strip — full width */}
      <div style={{
        position: "absolute",
        top: vertical ? 380 : 290,
        left: 0, right: 0,
        opacity: phoneOp,
        transform: `translateX(${phoneTx}px)`,
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: vertical ? 24 : 40,
          padding: vertical ? "30px 50px" : "36px 80px",
          background: `linear-gradient(90deg, transparent 0%, ${c.design.accent}33 50%, transparent 100%)`,
          borderTop: `2px solid ${c.design.accent}`,
          borderBottom: `2px solid ${c.design.accent}`,
        }}>
          <span style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 32 : 40,
            color: c.design.accent, letterSpacing: 8,
          }}>
            ☎ TEL.
          </span>
          <span style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 110 : 150,
            color: c.design.white, letterSpacing: 3, lineHeight: 1,
            textShadow: `0 0 50px ${c.design.accent}, 0 0 100px ${c.design.accent}77`,
          }}>
            {c.kontakt.telefon_buero}
          </span>
        </div>
      </div>

      {/* Address — centered massive block */}
      <div style={{
        position: "absolute",
        top: vertical ? 720 : 560,
        left: 0, right: 0,
        opacity: addrOp,
        transform: `translateX(${addrTx}px)`,
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 28 : 28,
          color: c.design.accent, letterSpacing: 10,
          marginBottom: 10,
        }}>
          📍  STANDORT
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 56 : 70,
          color: c.design.white, lineHeight: 1.1,
          textShadow: `0 0 30px ${c.design.accent}aa, 0 4px 20px rgba(0,0,0,0.8)`,
        }}>
          {c.kontakt.adresse_zeile1}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 600,
          fontSize: vertical ? 46 : 56,
          color: c.design.white, opacity: 0.92,
          lineHeight: 1.1, marginTop: 4,
        }}>
          {c.kontakt.adresse_zeile2}
        </div>
      </div>

      {/* Web bottom */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 100 : 70,
        left: 0, right: 0,
        opacity: webOp,
        textAlign: "center", padding: "0 40px",
      }}>
        {c.kontakt.website && (
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 44 : 50,
            color: c.design.accent, letterSpacing: 2,
            textShadow: `0 0 30px ${c.design.accent}, 0 0 60px ${c.design.accent}55`,
          }}>
            ▸ {c.kontakt.website} ◂
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final D — Editorial: massive watermark contact ────────
const SceneFinalD = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const labelOp = ci(f, [4, 22], [0, 1], EO);
  const labelW  = ci(f, [4, 30], [0, 80], EO);
  const nameOp  = ci(f, [12, 32], [0, 1], EO);
  const nameY   = ci(f, [12, 32], [-30, 0], EO);
  const phoneOp = ci(f, [26, 50], [0, 1], EO);
  const phoneSc = ci(f, [26, 52], [0.7, 1], POP);
  const addrOp  = ci(f, [42, 64], [0, 1], EO);
  const webOp   = ci(f, [56, 76], [0, 1], EO);

  const phonePulse = f >= 60 ? 1 + Math.sin((f - 60) * 0.16) * 0.025 : 1;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, #0a0a0a 0%, ${c.design.primary} 100%)`,
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.16 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(20px) brightness(0.4) saturate(1.4)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.12], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Editorial label */}
      <div style={{
        position: "absolute", top: vertical ? 100 : 60,
        left: vertical ? 50 : 100,
        opacity: labelOp,
        display: "flex", alignItems: "center", gap: 18,
      }}>
        <div style={{
          width: labelW, height: 2,
          background: c.design.accent,
          boxShadow: `0 0 12px ${c.design.accent}`,
        }} />
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 22 : 20,
          color: c.design.accent, letterSpacing: 8,
          textTransform: "uppercase",
        }}>
          KONTAKT · {c.kontakt.adresse_zeile2.split(" ").slice(-1)[0] || ""}
        </div>
      </div>

      {/* Brand name editorial */}
      <div style={{
        position: "absolute", top: vertical ? 180 : 130,
        left: vertical ? 50 : 100, right: vertical ? 50 : 100,
        opacity: nameOp,
        transform: `translateY(${nameY}px)`,
      }}>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 60 : 64,
          color: c.design.accent,
          textShadow: `0 0 30px ${c.design.accent}77`,
        }}>
          {c.unternehmen.slogan}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 76 : 88,
          color: c.design.white, letterSpacing: 1, lineHeight: 1.0,
          marginTop: 4,
          textShadow: `0 0 30px ${c.design.accent}88`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
      </div>

      {/* Phone with massive watermark */}
      <div style={{
        position: "absolute",
        top: vertical ? 460 : 350,
        left: 0, right: 0,
        opacity: phoneOp,
        transform: `scale(${phoneSc * phonePulse})`,
      }}>
        {/* Watermark "RUF" or huge phone */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 320 : 480,
          color: "transparent",
          WebkitTextStroke: `2px ${c.design.accent}33`,
          letterSpacing: -8, lineHeight: 0.85,
          pointerEvents: "none",
        }}>
          ☎
        </div>
        <div style={{
          position: "relative",
          textAlign: "center",
          padding: "0 40px",
        }}>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 28 : 30,
            color: c.design.accent, letterSpacing: 12,
            marginBottom: 10,
            textShadow: `0 0 20px ${c.design.accent}`,
          }}>
            JETZT ANRUFEN
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 130 : 180,
            color: c.design.white, lineHeight: 1,
            letterSpacing: 3,
            textShadow: `0 0 60px ${c.design.accent}, 0 6px 30px rgba(0,0,0,0.7)`,
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>
      </div>

      {/* Address line */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 260 : 200,
        left: vertical ? 50 : 100, right: vertical ? 50 : 100,
        opacity: addrOp,
        transform: `translateX(${ci(f, [42, 64], [-60, 0], EO)}px)`,
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 18,
          padding: "16px 40px",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          borderTop: `2px solid ${c.design.accent}`,
          borderBottom: `2px solid ${c.design.accent}`,
        }}>
          <span style={{ fontSize: vertical ? 40 : 44, color: c.design.accent }}>📍</span>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 42 : 50,
              color: c.design.white, lineHeight: 1.1,
            }}>
              {c.kontakt.adresse_zeile1}
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 600,
              fontSize: vertical ? 32 : 38,
              color: "rgba(255,255,255,0.9)",
            }}>
              {c.kontakt.adresse_zeile2}
            </div>
          </div>
        </div>
      </div>

      {/* Website footer */}
      <div style={{
        position: "absolute", bottom: vertical ? 100 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: webOp,
      }}>
        {c.kontakt.website && (
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 38 : 42,
            color: c.design.accent, letterSpacing: 3,
            textShadow: `0 0 30px ${c.design.accent}`,
          }}>
            ▸  {c.kontakt.website}  ◂
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final E — Broadcast: News-Anchor Frame ────────────────
const SceneFinalE = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const stripeOp = ci(f, [4, 18], [0, 1], EO);
  const brandOp = ci(f, [10, 28], [0, 1], EO);
  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const phoneTx = ci(f, [22, 44], [80, 0], EO);
  const addrOp = ci(f, [38, 60], [0, 1], EO);
  const tickerOp = ci(f, [48, 68], [0, 1], EO);

  const phonePulse = f >= 50 ? 1 + Math.sin((f - 50) * 0.18) * 0.03 : 1;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, #050010 100%)`,
      opacity: bgOp * fade,
    }}>
      {c.assets.hero && (
        <AbsoluteFill style={{ opacity: 0.18 }}>
          <Img src={staticFile(c.assets.hero)} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "blur(16px) brightness(0.45) saturate(1.4)",
            transform: `scale(${ci(f, [0, END - START], [1.0, 1.12], EI)})`,
          }} />
        </AbsoluteFill>
      )}
      <Bokeh frame={frame} w={W} h={H} count={25} color={c.design.accent} />

      {/* Top broadcast strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: vertical ? 90 : 80,
        background: c.design.accent,
        display: "flex", alignItems: "center",
        padding: "0 40px",
        opacity: stripeOp,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 36 : 32,
          color: c.design.white, letterSpacing: 8,
        }}>
          ◆ KONTAKT
        </div>
        <div style={{
          marginLeft: "auto",
          fontFamily: BODY, fontWeight: 600,
          fontSize: vertical ? 24 : 20,
          color: c.design.white, letterSpacing: 4,
        }}>
          24/7 ERREICHBAR
        </div>
      </div>

      {/* Main content split */}
      <div style={{
        position: "absolute",
        top: vertical ? 130 : 120,
        bottom: vertical ? 110 : 90,
        left: 0, right: 0,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 30 : 50,
        padding: vertical ? "30px 50px" : "40px 80px",
      }}>
        {/* Left/top: Brand + Address */}
        <div style={{
          flex: 1,
          opacity: brandOp,
          display: "flex", flexDirection: "column",
          justifyContent: "center", gap: 24,
        }}>
          <div>
            <div style={{
              fontFamily: BODY, fontWeight: 700,
              fontSize: vertical ? 22 : 22,
              color: c.design.accent, letterSpacing: 8,
              marginBottom: 10,
            }}>
              ▸ {c.unternehmen.name.toUpperCase().split(" ")[0]}
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 60 : 70,
              color: c.design.white, lineHeight: 1.0,
              textShadow: `0 0 30px ${c.design.accent}aa`,
            }}>
              {c.unternehmen.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily: SCRIPT, fontSize: vertical ? 50 : 50,
              color: c.design.accent, marginTop: 4,
              textShadow: `0 0 20px ${c.design.accent}`,
            }}>
              {c.unternehmen.slogan}
            </div>
          </div>

          <div style={{
            opacity: addrOp,
            padding: "20px 28px",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            borderLeft: `4px solid ${c.design.accent}`,
          }}>
            <div style={{
              fontFamily: BODY, fontWeight: 700,
              fontSize: vertical ? 20 : 18,
              color: c.design.accent, letterSpacing: 6,
              marginBottom: 6,
            }}>
              📍 STANDORT
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 38 : 44,
              color: c.design.white, lineHeight: 1.1,
            }}>
              {c.kontakt.adresse_zeile1}
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 600,
              fontSize: vertical ? 30 : 36,
              color: "rgba(255,255,255,0.9)",
            }}>
              {c.kontakt.adresse_zeile2}
            </div>
          </div>
        </div>

        {/* Right/bottom: PHONE BIG */}
        <div style={{
          flex: 1,
          opacity: phoneOp,
          transform: `translateX(${phoneTx}px) scale(${phonePulse})`,
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          background: `linear-gradient(135deg, ${c.design.accent} 0%, ${c.design.primary} 200%)`,
          borderRadius: 22,
          padding: vertical ? "30px" : "50px",
          boxShadow: `0 0 60px ${c.design.accent}, 0 30px 80px rgba(0,0,0,0.7)`,
          border: `4px solid rgba(255,255,255,0.2)`,
        }}>
          <div style={{ fontSize: vertical ? 70 : 90 }}>📞</div>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 26 : 28,
            color: c.design.white, letterSpacing: 8,
            marginTop: 8, marginBottom: 14,
          }}>
            DIREKT ANRUFEN
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 88 : 130,
            color: c.design.white, lineHeight: 1,
            letterSpacing: 2,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: vertical ? 70 : 60,
        background: "rgba(0,0,0,0.85)",
        borderTop: `2px solid ${c.design.accent}`,
        display: "flex", alignItems: "center",
        opacity: tickerOp,
        overflow: "hidden",
      }}>
        <div style={{
          paddingLeft: 60, paddingRight: 40,
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 24 : 22,
          color: c.design.white, letterSpacing: 4,
          whiteSpace: "nowrap",
          transform: `translateX(${-((f * 5) % 1800)}px)`,
        }}>
          ◆ {c.kontakt.website || "www.example.com"} ◆ {c.kontakt.email || ""} ◆ {c.kontakt.telefon_buero} ◆ {c.unternehmen.slogan} ◆ JETZT KONTAKTIEREN ◆ {c.kontakt.website || ""} ◆
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Final F — Geometric: Frame + Hex Phone ────────────────
const SceneFinalF = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  // Frame draw
  const fp1 = ci(f, [4, 18], [0, 1], EO);
  const fp2 = ci(f, [10, 24], [0, 1], EO);
  const fp3 = ci(f, [16, 30], [0, 1], EO);
  const fp4 = ci(f, [22, 36], [0, 1], EO);

  const brandOp = ci(f, [22, 44], [0, 1], EO);
  const phoneOp = ci(f, [38, 58], [0, 1], EO);
  const phoneSc = ci(f, [38, 60], [0.7, 1], POP);
  const addrOp = ci(f, [54, 74], [0, 1], EO);

  const phonePulse = f >= 60 ? 1 + Math.sin((f - 60) * 0.16) * 0.03 : 1;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: bgOp * fade,
    }}>
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.05 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: 100, height: 115,
            background: c.design.accent,
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }} />
        ))}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Animated frame */}
      <div style={{
        position: "absolute",
        top: vertical ? 80 : 50, bottom: vertical ? 80 : 50,
        left: vertical ? 40 : 80, right: vertical ? 40 : 80,
        pointerEvents: "none",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 4, width: `${fp1 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: `${fp2 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, height: 4, width: `${fp3 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 4, height: `${fp4 * 100}%`, background: c.design.accent, boxShadow: `0 0 20px ${c.design.accent}` }} />
      </div>

      {/* Brand top */}
      <div style={{
        position: "absolute", top: vertical ? 160 : 130,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: brandOp,
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 22 : 20,
          color: c.design.accent, letterSpacing: 12,
          marginBottom: 10,
        }}>
          [ KONTAKT ]
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 70 : 80,
          color: c.design.white, lineHeight: 1.0,
          textShadow: `0 0 40px ${c.design.accent}aa`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 56 : 56,
          color: c.design.accent, marginTop: 6,
          textShadow: `0 0 24px ${c.design.accent}`,
        }}>
          {c.unternehmen.slogan}
        </div>
      </div>

      {/* Hexagon phone center */}
      <div style={{
        position: "absolute",
        top: vertical ? 540 : 380,
        left: "50%", transform: `translateX(-50%) scale(${phoneSc * phonePulse})`,
        opacity: phoneOp,
        width: vertical ? 800 : 880,
        height: vertical ? 380 : 360,
      }}>
        {/* Outer hex */}
        <div style={{
          position: "absolute", inset: 0,
          background: c.design.accent,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          boxShadow: `0 0 80px ${c.design.accent}`,
        }} />
        <div style={{
          position: "absolute", inset: 6,
          background: `linear-gradient(135deg, #0a0a0a 0%, ${c.design.primary} 100%)`,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }} />
        {/* Phone content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 80px",
        }}>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 26 : 28,
            color: c.design.accent, letterSpacing: 10,
            marginBottom: 14,
            textShadow: `0 0 16px ${c.design.accent}`,
          }}>
            ☎  ANRUFEN
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 100 : 130,
            color: c.design.white, letterSpacing: 3, lineHeight: 1,
            textShadow: `0 0 40px ${c.design.accent}, 0 0 80px ${c.design.accent}77`,
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>
      </div>

      {/* Address + web below */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 180 : 130,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: addrOp,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 44 : 52,
          color: c.design.white, lineHeight: 1.1,
          textShadow: `0 0 24px ${c.design.accent}aa`,
        }}>
          📍 {c.kontakt.adresse_zeile1}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 600,
          fontSize: vertical ? 36 : 42,
          color: "rgba(255,255,255,0.9)",
          marginTop: 4,
        }}>
          {c.kontakt.adresse_zeile2}
        </div>
        {c.kontakt.website && (
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 32 : 38,
            color: c.design.accent, letterSpacing: 2,
            marginTop: 18,
            textShadow: `0 0 24px ${c.design.accent}`,
          }}>
            ▸ {c.kontakt.website}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final G — EXPLOSIVE: massive radial sun + shockwave phone ──
const SceneFinalG = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;
  const cx = W / 2, cy = H / 2;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const phoneOp = ci(f, [10, 30], [0, 1], EO);
  const phoneSc = ci(f, [10, 36], [0.0, 1], POP);

  // Shockwave rings around phone
  const ring1 = (f - 30) % 50;
  const ring2 = (f - 30 + 25) % 50;
  const ringScale = (r) => 1 + (r / 50) * 4;
  const ringOp = (r) => Math.max(0, 0.7 - (r / 50));

  const addrOp = ci(f, [40, 60], [0, 1], EO);
  const webOp = ci(f, [54, 74], [0, 1], EO);
  const phonePulse = 1 + Math.sin(f * 0.18) * 0.04;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 50% 50%, ${c.design.primary} 0%, #000 80%)`,
      opacity: bgOp * fade,
    }}>
      {/* Sun rays */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.3 }}>
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 360) / 36 + f * 0.3;
          return (
            <div key={i} style={{
              position: "absolute",
              left: cx, top: cy,
              width: 2, height: "100%",
              background: `linear-gradient(180deg, ${c.design.accent} 0%, transparent 70%)`,
              transform: `rotate(${angle}deg) translateY(-50%)`,
              transformOrigin: "0 0",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={30} color={c.design.accent} />

      {/* Brand top */}
      <div style={{
        position: "absolute", top: vertical ? 90 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: ci(f, [0, 20], [0, 1], EO),
        padding: "0 40px",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 60 : 64,
          color: c.design.white, letterSpacing: 1,
          textShadow: `0 0 40px ${c.design.accent}`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        {c.unternehmen.slogan && (
          <div style={{
            fontFamily: SCRIPT, fontSize: vertical ? 50 : 50,
            color: c.design.accent, marginTop: 4,
            textShadow: `0 0 30px ${c.design.accent}`,
          }}>
            {c.unternehmen.slogan}
          </div>
        )}
      </div>

      {/* PHONE with rings */}
      <div style={{
        position: "absolute",
        top: vertical ? 380 : 280,
        left: 0, right: 0,
        opacity: phoneOp,
      }}>
        <div style={{ position: "relative" }}>
          {/* Shockwave rings */}
          {[ring1, ring2].map((r, i) => (
            <div key={i} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 600, height: 200,
              transform: `translate(-50%, -50%) scale(${ringScale(r)})`,
              border: `4px solid ${c.design.accent}`,
              borderRadius: 30,
              opacity: ringOp(r) * 0.8,
              boxShadow: `0 0 30px ${c.design.accent}`,
              pointerEvents: "none",
            }} />
          ))}
          <div style={{
            transform: `scale(${phoneSc * phonePulse})`,
            textAlign: "center",
            padding: "0 40px",
          }}>
            <div style={{
              fontFamily: BODY, fontWeight: 700,
              fontSize: vertical ? 32 : 36,
              color: c.design.accent, letterSpacing: 14,
              marginBottom: 16,
              textShadow: `0 0 30px ${c.design.accent}`,
            }}>
              ☎ JETZT ANRUFEN
            </div>
            <div style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize: vertical ? 130 : 200,
              color: c.design.white, lineHeight: 1, letterSpacing: 4,
              textShadow: `0 0 60px ${c.design.accent}, 0 0 120px ${c.design.accent}aa`,
            }}>
              {c.kontakt.telefon_buero}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 200 : 150,
        left: 0, right: 0,
        opacity: addrOp,
        textAlign: "center", padding: "0 40px",
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 46 : 56,
          color: c.design.white, lineHeight: 1.1,
          textShadow: `0 0 30px ${c.design.accent}`,
        }}>
          📍 {c.kontakt.adresse_zeile1}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 600,
          fontSize: vertical ? 36 : 44,
          color: "rgba(255,255,255,0.92)",
          marginTop: 4,
        }}>
          {c.kontakt.adresse_zeile2}
        </div>
      </div>

      {/* Web */}
      <div style={{
        position: "absolute", bottom: vertical ? 90 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: webOp,
      }}>
        {c.kontakt.website && (
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 36 : 40,
            color: c.design.accent, letterSpacing: 2,
            textShadow: `0 0 30px ${c.design.accent}`,
          }}>
            ▸ {c.kontakt.website} ◂
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final H — LIQUID FLOW: morphing blob contact card ──
const SceneFinalH = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const blobR = (seed: number) => {
    const t = f * 0.04 + seed;
    return `${50 + Math.sin(t) * 12}% ${50 + Math.cos(t * 1.2) * 12}% ${50 + Math.sin(t * 0.8) * 12}% ${50 + Math.cos(t * 1.5) * 12}% / ${50 + Math.cos(t) * 12}% ${50 + Math.sin(t * 1.3) * 12}% ${50 + Math.cos(t * 0.9) * 12}% ${50 + Math.sin(t * 1.4) * 12}%`;
  };

  const brandOp = ci(f, [4, 26], [0, 1], EO);
  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const addrOp = ci(f, [40, 60], [0, 1], EO);
  const webOp = ci(f, [56, 76], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c.design.primary} 0%, #1a0a2e 50%, ${c.design.accent}55 100%)`,
      opacity: bgOp * fade,
    }}>
      {/* Floating blobs */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const seed = i * 1.7;
          const x = 30 + Math.sin(f * 0.02 + seed) * 35;
          const y = 30 + Math.cos(f * 0.025 + seed) * 35;
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              width: 500, height: 500,
              transform: "translate(-50%, -50%)",
              background: i % 2 === 0 ? c.design.accent : c.design.primary,
              borderRadius: blobR(seed),
              opacity: 0.3,
              filter: "blur(50px)",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={20} color={c.design.accent} />

      {/* Brand */}
      <div style={{
        position: "absolute", top: vertical ? 130 : 80,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: brandOp,
        transform: `translateY(${ci(f, [4, 26], [-30, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 70 : 70,
          color: c.design.accent,
          textShadow: `0 0 30px ${c.design.accent}aa`,
          marginBottom: 6,
        }}>
          {c.unternehmen.slogan}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 70 : 84,
          color: c.design.white, letterSpacing: 1, lineHeight: 1.0,
          textShadow: `0 0 40px ${c.design.accent}aa`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
      </div>

      {/* Big morphing blob phone */}
      <div style={{
        position: "absolute",
        top: vertical ? 480 : 320,
        left: "50%",
        transform: `translateX(-50%) scale(${ci(f, [22, 50], [0.7, 1], POP)})`,
        opacity: phoneOp,
        width: vertical ? 880 : 1100,
        padding: vertical ? "60px 50px" : "70px 80px",
        background: `linear-gradient(135deg, ${c.design.accent} 0%, ${c.design.primary} 100%)`,
        borderRadius: blobR(0),
        boxShadow: `0 30px 80px ${c.design.accent}77, inset 0 0 50px rgba(255,255,255,0.1)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 28 : 28,
          color: c.design.white, letterSpacing: 10,
          marginBottom: 16,
          opacity: 0.9,
        }}>
          ANRUFEN
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 110 : 160,
          color: c.design.white, lineHeight: 1, letterSpacing: 3,
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}>
          {c.kontakt.telefon_buero}
        </div>
      </div>

      {/* Address blob */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 220 : 150,
        left: vertical ? 80 : "15%",
        right: vertical ? 80 : "15%",
        opacity: addrOp,
        transform: `translateY(${ci(f, [40, 60], [40, 0], EO)}px)`,
      }}>
        <div style={{
          padding: vertical ? "26px 36px" : "30px 50px",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          borderRadius: blobR(2),
          border: `2px solid rgba(255,255,255,0.2)`,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 38 : 46,
            color: c.design.white, lineHeight: 1.1,
          }}>
            📍 {c.kontakt.adresse_zeile1}
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 600,
            fontSize: vertical ? 30 : 36,
            color: "rgba(255,255,255,0.9)", marginTop: 4,
          }}>
            {c.kontakt.adresse_zeile2}
          </div>
        </div>
      </div>

      {/* Web */}
      <div style={{
        position: "absolute", bottom: vertical ? 100 : 60,
        left: 0, right: 0, textAlign: "center",
        opacity: webOp,
      }}>
        {c.kontakt.website && (
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 38 : 42,
            color: c.design.accent, letterSpacing: 2,
            textShadow: `0 0 30px ${c.design.accent}`,
          }}>
            🌐 {c.kontakt.website}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final I — RETRO SYNTHWAVE ──
const SceneFinalI = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const gridOffset = (f * 4) % 80;

  const brandOp = ci(f, [4, 28], [0, 1], EO);
  const brandSc = ci(f, [4, 32], [0.7, 1], POP);
  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const addrOp = ci(f, [44, 64], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, #0a0014 0%, ${c.design.primary} 35%, #ff006e 75%, #ffd700 100%)`,
      opacity: bgOp * fade,
    }}>
      {/* Grid floor */}
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          bottom: 0, left: "-20%", right: "-20%",
          height: "55%",
          backgroundImage: `
            linear-gradient(${c.design.accent}cc 1px, transparent 1px),
            linear-gradient(90deg, ${c.design.accent}cc 1px, transparent 1px)
          `,
          backgroundSize: `80px 80px`,
          backgroundPosition: `0 ${gridOffset}px, ${gridOffset}px 0`,
          transform: "perspective(600px) rotateX(60deg)",
          transformOrigin: "center top",
          maskImage: "linear-gradient(180deg, transparent 0%, black 30%, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 30%, black 90%, transparent 100%)",
        }} />
      </AbsoluteFill>

      {/* Sun semi-circle */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: vertical ? "32%" : "30%",
        transform: "translate(-50%, -50%)",
        width: vertical ? 800 : 900,
        height: vertical ? 800 : 900,
        borderRadius: "50%",
        background: "linear-gradient(180deg, #ffd700 0%, #ff8c00 50%, #ff006e 100%)",
        boxShadow: "0 0 100px #ff006eaa, 0 0 200px #ffd70055",
      }} />
      <div style={{
        position: "absolute",
        left: "50%",
        top: vertical ? "32%" : "30%",
        transform: "translate(-50%, -50%)",
        width: vertical ? 800 : 900,
        height: vertical ? 800 : 900,
        opacity: 0.85,
      }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: 0, right: 0,
            top: `${10 + i * 7}%`,
            height: `${1 + i * 0.5}px`,
            background: "#0a0014",
          }} />
        ))}
      </div>

      {/* Brand chrome 3D */}
      <div style={{
        position: "absolute",
        top: vertical ? 140 : 80,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: brandOp,
        transform: `scale(${brandSc})`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 70 : 80,
          background: "linear-gradient(180deg, #ffd700 0%, #fff 30%, #ff006e 60%, #00f5ff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 1, lineHeight: 1.0,
          filter: `drop-shadow(0 4px 0 #0a0014) drop-shadow(0 8px 0 ${c.design.primary})`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 22 : 22,
          color: "#00f5ff", letterSpacing: 12,
          marginTop: 12,
          textShadow: "0 0 30px #00f5ff",
        }}>
          ◢ ESTABLISHED ◣
        </div>
      </div>

      {/* PHONE — neon panel */}
      <div style={{
        position: "absolute",
        top: vertical ? 760 : 520,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: phoneOp,
        transform: `scale(${ci(f, [22, 46], [0.7, 1], POP)})`,
      }}>
        <div style={{
          display: "inline-block",
          padding: vertical ? "26px 50px" : "32px 70px",
          background: "rgba(10,0,20,0.85)",
          border: "4px solid #00f5ff",
          borderRadius: 6,
          boxShadow: "0 0 50px #00f5ffaa, inset 0 0 30px rgba(0,245,255,0.15)",
        }}>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 24 : 24,
            color: "#00f5ff", letterSpacing: 8,
            marginBottom: 14,
            textShadow: "0 0 20px #00f5ff",
          }}>
            ☎ DIRECT.LINE
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 90 : 110,
            background: "linear-gradient(180deg, #ffd700 0%, #fff 50%, #ff006e 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 4, lineHeight: 1,
            filter: "drop-shadow(0 0 30px #ff006eaa)",
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>
      </div>

      {/* Address neon banner */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 160 : 100,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: addrOp,
      }}>
        <div style={{
          display: "inline-block",
          padding: "14px 36px",
          background: "rgba(10,0,20,0.7)",
          border: "2px solid #ff006e",
          borderRadius: 4,
          boxShadow: "0 0 30px #ff006eaa",
        }}>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 28 : 32,
            color: "#fff", letterSpacing: 1,
            textShadow: "0 0 20px #ff006e",
          }}>
            📍 {c.kontakt.adresse_zeile1} · {c.kontakt.adresse_zeile2}
          </div>
        </div>
        {c.kontakt.website && (
          <div style={{
            marginTop: 12,
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 24 : 24,
            color: "#ffd700", letterSpacing: 4,
            textShadow: "0 0 20px #ffd700",
          }}>
            ▸ {c.kontakt.website} ◂
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final J — PRISM HOLOGRAPHIC: rainbow card phone ──
const SceneFinalJ = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const shimmer = (f * 2) % 200;
  const brandOp = ci(f, [4, 28], [0, 1], EO);
  const phoneOp = ci(f, [22, 44], [0, 1], EO);
  const phoneSc = ci(f, [22, 50], [0.7, 1], POP);
  const addrOp = ci(f, [44, 64], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: "#050010",
      opacity: bgOp * fade,
    }}>
      {/* Holographic background */}
      <AbsoluteFill style={{
        background: `linear-gradient(${(f * 0.5) % 360}deg,
          #ff006e22, #00f5ff22, #ffd70022, #ff00ff22, #00ff8822)`,
        opacity: 0.7,
      }} />
      {/* Floating prisms */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.4 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const seed = i * 1.7;
          const x = 50 + Math.sin(f * 0.025 + seed) * 45;
          const y = 50 + Math.cos(f * 0.03 + seed) * 45;
          const rot = (f * 0.6 + i * 36) % 360;
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              width: 200, height: 200,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              background: `linear-gradient(${i * 36}deg, #ff006e, #00f5ff, #ffd700)`,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              filter: "blur(40px)",
            }} />
          );
        })}
      </AbsoluteFill>
      <Bokeh frame={frame} w={W} h={H} count={30} color="#ff006e" />

      {/* Brand top */}
      <div style={{
        position: "absolute", top: vertical ? 110 : 70,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: brandOp,
        transform: `translateY(${ci(f, [4, 28], [-30, 0], EO)}px)`,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 64 : 70,
          background: `linear-gradient(110deg, #ff006e, #00f5ff, #ffd700, #ff00ff, #ff006e)`,
          backgroundSize: "200% 100%",
          backgroundPosition: `${shimmer}% 0`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 1, lineHeight: 1.0,
          filter: `drop-shadow(0 0 30px #ff006e)`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
        {c.unternehmen.slogan && (
          <div style={{
            fontFamily: SCRIPT, fontSize: vertical ? 50 : 50,
            color: "#fff", marginTop: 4,
            textShadow: "0 0 30px #00f5ff",
          }}>
            {c.unternehmen.slogan}
          </div>
        )}
      </div>

      {/* Big diamond phone */}
      <div style={{
        position: "absolute",
        top: vertical ? 480 : 340,
        left: "50%",
        transform: `translateX(-50%) scale(${phoneSc})`,
        opacity: phoneOp,
        width: vertical ? 850 : 950,
        height: vertical ? 600 : 480,
      }}>
        {/* Holographic outer */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(${shimmer * 1.8}deg, #ff006e, #00f5ff, #ffd700, #ff00ff, #ff006e)`,
          backgroundSize: "200% 200%",
          backgroundPosition: `${shimmer}% 50%`,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          boxShadow: "0 0 100px #ff006eaa, 0 0 200px #00f5ff77",
        }} />
        <div style={{
          position: "absolute", inset: 8,
          background: "linear-gradient(135deg, #050010 0%, #1a0a2e 100%)",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 80px",
        }}>
          <div style={{
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 28 : 28,
            color: "#fff", letterSpacing: 12,
            marginBottom: 16,
            textShadow: "0 0 20px #ff006e",
          }}>
            ☎ ANRUFEN
          </div>
          <div style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 100 : 130,
            background: `linear-gradient(180deg, #ff006e, #00f5ff, #ffd700)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 4, lineHeight: 1,
            filter: "drop-shadow(0 0 40px #ff006e)",
          }}>
            {c.kontakt.telefon_buero}
          </div>
        </div>
      </div>

      {/* Address + Web */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 120 : 80,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: addrOp,
      }}>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 36 : 42,
          color: "#fff", lineHeight: 1.1,
          textShadow: "0 0 20px #00f5ff",
        }}>
          📍 {c.kontakt.adresse_zeile1}, {c.kontakt.adresse_zeile2}
        </div>
        {c.kontakt.website && (
          <div style={{
            marginTop: 10,
            fontFamily: HEAD, fontWeight: 700,
            fontSize: vertical ? 32 : 36,
            background: `linear-gradient(110deg, #ff006e, #00f5ff)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 2,
          }}>
            🌐 {c.kontakt.website}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final K — MOTION DESIGN: Bauhaus split layout ──
const SceneFinalK = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const circleX = ci(f, [4, 30], [-300, 0], EO);
  const squareY = ci(f, [8, 36], [-300, 0], EO);

  const phoneOp = ci(f, [16, 38], [0, 1], EO);
  const phoneTx = ci(f, [16, 42], [-100, 0], EO);

  return (
    <AbsoluteFill style={{
      background: "#0a0a0a",
      opacity: bgOp * fade,
    }}>
      {/* Grid */}
      <AbsoluteFill style={{
        opacity: 0.04,
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: "100px 100px",
      }} />

      {/* Big rotating circle */}
      <div style={{
        position: "absolute",
        top: vertical ? "50%" : "40%",
        left: vertical ? "10%" : "5%",
        transform: `translateX(${circleX}px) rotate(${(f * 0.3) % 360}deg)`,
        width: vertical ? 500 : 700, height: vertical ? 500 : 700,
        background: c.design.accent,
        borderRadius: "50%",
        opacity: 0.9,
      }} />

      {/* Big yellow square */}
      <div style={{
        position: "absolute",
        top: vertical ? -100 : -150,
        right: vertical ? -100 : -150,
        transform: `translateY(${squareY}px) rotate(${(f * -0.4) % 360}deg)`,
        width: 500, height: 500,
        background: "#ffd700",
      }} />

      {/* Header — strict typography */}
      <div style={{
        position: "absolute",
        top: vertical ? 100 : 80,
        left: vertical ? 60 : 100,
        opacity: ci(f, [12, 30], [0, 1], EO),
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 800,
          fontSize: vertical ? 22 : 22,
          color: "#fff", letterSpacing: 12,
          marginBottom: 8,
        }}>
          ◼ KONTAKT
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 110 : 130,
          color: "#fff", lineHeight: 0.9,
          letterSpacing: -4,
        }}>
          {c.unternehmen.name.toUpperCase().split(" ")[0]}
        </div>
      </div>

      {/* PHONE — big yellow card */}
      <div style={{
        position: "absolute",
        top: vertical ? 480 : 340,
        left: vertical ? 60 : 100,
        right: vertical ? 60 : "40%",
        opacity: phoneOp,
        transform: `translateX(${phoneTx}px)`,
        background: "#ffd700",
        padding: vertical ? "40px 50px" : "60px 70px",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 800,
          fontSize: vertical ? 22 : 22,
          color: "#0a0a0a", letterSpacing: 10,
          marginBottom: 14,
        }}>
          ☎  ANRUFEN
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 100 : 140,
          color: "#0a0a0a", lineHeight: 0.9,
          letterSpacing: -3,
        }}>
          {c.kontakt.telefon_buero}
        </div>
      </div>

      {/* Address — bottom right */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 120 : 80,
        right: vertical ? 60 : 100,
        left: vertical ? 60 : "40%",
        opacity: ci(f, [40, 60], [0, 1], EO),
        transform: `translateY(${ci(f, [40, 60], [40, 0], EO)}px)`,
        background: c.design.accent,
        padding: vertical ? "26px 36px" : "36px 50px",
        borderRadius: 0,
        textAlign: vertical ? "left" : "right",
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 800,
          fontSize: 18, color: "#fff",
          letterSpacing: 8, marginBottom: 6,
        }}>
          📍 STANDORT
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 36 : 44,
          color: "#fff", lineHeight: 1.1,
        }}>
          {c.kontakt.adresse_zeile1}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 600,
          fontSize: vertical ? 28 : 36,
          color: "rgba(255,255,255,0.9)", marginTop: 2,
        }}>
          {c.kontakt.adresse_zeile2}
        </div>
        {c.kontakt.website && (
          <div style={{
            marginTop: 10,
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 22 : 24,
            color: "#0a0a0a", letterSpacing: 2,
          }}>
            ▸ {c.kontakt.website}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Final L — CINEMA NOIR: letterbox + lens flare contact ──
const SceneFinalL = ({ frame, c, vertical }: { frame: number; c: AdConfig; vertical: boolean }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const HEAD = font(c.design.fontHead);
  const BODY = font(c.design.fontBody);
  const SCRIPT = font(c.design.fontScript);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const fade = ci(f, [END - START - 14, END - START], [1, 0], EIN);

  const barH = ci(f, [0, 22], [0, 100], EO);
  const flareX = ci(f, [10, 90], [-30, 130], EO);

  const titleOp = ci(f, [16, 36], [0, 1], EO);
  const phoneOp = ci(f, [30, 54], [0, 1], EO);
  const phoneSc = ci(f, [30, 60], [1.1, 1], EI);
  const addrOp = ci(f, [50, 70], [0, 1], EO);

  return (
    <AbsoluteFill style={{
      background: "#0a0a0a",
      opacity: bgOp * fade,
    }}>
      {/* Vignette */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, ${c.design.primary}55 0%, transparent 70%)`,
      }} />
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)`,
      }} />

      {/* Lens flare streak */}
      <div style={{
        position: "absolute",
        left: `${flareX}%`,
        top: vertical ? "40%" : "35%",
        width: "70%", height: 4,
        background: `linear-gradient(90deg, transparent 0%, ${c.design.accent} 50%, transparent 100%)`,
        boxShadow: `0 0 80px ${c.design.accent}, 0 0 200px ${c.design.accent}`,
        opacity: 0.5,
        filter: "blur(2px)",
        transform: "translateX(-35%)",
      }} />

      <Bokeh frame={frame} w={W} h={H} count={15} color={c.design.accent} />

      {/* Letterbox */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: `${barH * 1.3}px`, background: "#000",
        zIndex: 10,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: `${barH * 1.3}px`, background: "#000",
        zIndex: 10,
      }} />

      {/* Title */}
      <div style={{
        position: "absolute",
        top: vertical ? 280 : 200,
        left: 0, right: 0, textAlign: "center", padding: "0 80px",
        opacity: titleOp,
      }}>
        <div style={{
          fontFamily: SCRIPT, fontSize: vertical ? 76 : 70,
          color: c.design.accent,
          textShadow: `0 0 50px ${c.design.accent}`,
          marginBottom: 10,
          letterSpacing: 4,
        }}>
          {c.unternehmen.slogan}
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 90 : 100,
          color: "#fff", letterSpacing: -1, lineHeight: 1.0,
          textShadow: `0 0 60px ${c.design.accent}, 0 4px 30px rgba(0,0,0,0.8)`,
        }}>
          {c.unternehmen.name.toUpperCase()}
        </div>
      </div>

      {/* MEGA PHONE */}
      <div style={{
        position: "absolute",
        top: vertical ? 700 : 520,
        left: 0, right: 0, textAlign: "center", padding: "0 40px",
        opacity: phoneOp,
        transform: `scale(${phoneSc})`,
      }}>
        <div style={{
          fontFamily: BODY, fontWeight: 700,
          fontSize: vertical ? 26 : 28,
          color: c.design.accent, letterSpacing: 16,
          marginBottom: 14,
          textShadow: `0 0 30px ${c.design.accent}`,
        }}>
          ▸ FÜR EIN GESPRÄCH ◂
        </div>
        <div style={{
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 130 : 200,
          color: "#fff", letterSpacing: 4, lineHeight: 1,
          textShadow: `0 0 50px ${c.design.accent}, 0 0 120px ${c.design.accent}88, 0 6px 30px rgba(0,0,0,0.8)`,
        }}>
          {c.kontakt.telefon_buero}
        </div>
      </div>

      {/* Address bottom */}
      <div style={{
        position: "absolute",
        bottom: vertical ? 200 : 130,
        left: 0, right: 0, textAlign: "center", padding: "0 60px",
        opacity: addrOp,
      }}>
        <div style={{
          display: "inline-block",
          padding: "12px 36px",
          borderTop: `2px solid ${c.design.accent}aa`,
          borderBottom: `2px solid ${c.design.accent}aa`,
          fontFamily: HEAD, fontWeight: 700,
          fontSize: vertical ? 30 : 36,
          color: "#fff", letterSpacing: 2,
          textShadow: `0 0 20px ${c.design.accent}88`,
        }}>
          📍 {c.kontakt.adresse_zeile1} · {c.kontakt.adresse_zeile2}
        </div>
        {c.kontakt.website && (
          <div style={{
            marginTop: 14,
            fontFamily: BODY, fontWeight: 700,
            fontSize: vertical ? 24 : 26,
            color: c.design.accent, letterSpacing: 6,
            textShadow: `0 0 20px ${c.design.accent}`,
          }}>
            ▸ {c.kontakt.website} ◂
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const FadeBlack = ({ frame, total }: { frame: number; total: number }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return <AbsoluteFill style={{ background: "#000", opacity: op, pointerEvents: "none" }} />;
};

// Internally all scenes are coded against a 450-frame timeline.
// We remap the actual frame to that virtual timeline so the duration
// can be changed via config.duration without touching scene code.
const useVirtualFrame = (): number => {
  const real = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (real * 450) / Math.max(1, durationInFrames);
};

export const AdCinematicH: React.FC<{ config: AdConfig }> = ({ config }) => {
  const c = applyFontPreset(config);
  const frame = useVirtualFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <SceneHero     frame={frame} c={c} vertical={false} />
      <SceneVorteile frame={frame} c={c} vertical={false} />
      <SceneCTA      frame={frame} c={c} vertical={false} />
      <SceneFinal    frame={frame} c={c} vertical={false} />
      <FadeBlack     frame={frame} total={450} />
    </AbsoluteFill>
  );
};

export const AdCinematicV: React.FC<{ config: AdConfig }> = ({ config }) => {
  const c = applyFontPreset(config);
  const frame = useVirtualFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <SceneHero     frame={frame} c={c} vertical={true} />
      <SceneVorteile frame={frame} c={c} vertical={true} />
      <SceneCTA      frame={frame} c={c} vertical={true} />
      <SceneFinal    frame={frame} c={c} vertical={true} />
      <FadeBlack     frame={frame} total={450} />
    </AbsoluteFill>
  );
};
