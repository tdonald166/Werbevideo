import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { noise2D } from "@remotion/noise";
import { LightLeak } from "@remotion/light-leaks";

// ─── Palette ──────────────────────────────────────────────
const C = {
  magenta:  "#be0072",
  magenta2: "#8a0052",
  blue:     "#3a7fc1",
  green:    "#5cb85c",
  orange:   "#f5a623",
  purple:   "#9b59b6",
  yellow:   "#ffd000",
  teal:     "#00897b",
};

const COLORS = [C.magenta, C.blue, C.orange, C.green, C.purple, C.yellow, C.teal, C.magenta2];

// Best-practice bezier curves
const EASE_EXIT  = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_ENTER = Easing.bezier(0.16, 1, 0.3, 1);

// ─── Single horizontal blind strip ────────────────────────
const Blind = ({
  frame, fps,
  startSec, durSec = 0.28,
  color,
  topPct, heightPct, // position in % of canvas height
  goLeft,            // alternates direction
}: {
  frame: number; fps: number;
  startSec: number; durSec?: number;
  color: string;
  topPct: number; heightPct: number;
  goLeft: boolean;
}) => {
  const s = Math.round(startSec * fps);
  const d = Math.round(durSec * fps);

  const progress = interpolate(frame, [s, s + d], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_EXIT,
  });

  if (progress >= 1) return null;

  const tx = (goLeft ? -1150 : 1150) * progress;

  // Shimmer on leading edge
  const shimmer = interpolate(progress, [0, 0.3, 1], [0, 0.6, 0]);

  return (
    <>
      <div style={{
        position: "absolute",
        top: `${topPct}%`,
        left: 0,
        width: "100%",
        height: `${heightPct}%`,
        background: color,
        transform: `translateX(${tx}px)`,
        willChange: "transform",
      }} />
      {/* Shimmer stripe on leading edge */}
      <div style={{
        position: "absolute",
        top: `${topPct}%`,
        left: goLeft ? 0 : "auto",
        right: goLeft ? "auto" : 0,
        width: 6,
        height: `${heightPct}%`,
        background: "rgba(255,255,255,0.75)",
        transform: `translateX(${tx}px)`,
        opacity: shimmer,
        filter: "blur(2px)",
      }} />
    </>
  );
};

// ─── Circular spotlight reveal ─────────────────────────────
// A colored circle that expands then collapses revealing the poster
const Spotlight = ({
  frame, fps, startSec,
}: {
  frame: number; fps: number; startSec: number;
}) => {
  const s = Math.round(startSec * fps);
  const d = Math.round(0.5 * fps);

  const expand = interpolate(frame, [s, s + d], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1), // playful overshoot
  });
  const collapse = interpolate(frame, [s + d, s + d * 2], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: EASE_EXIT,
  });

  const scale = expand * (1 - collapse);
  if (scale <= 0.01) return null;

  return (
    <AbsoluteFill style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        width: 1400,
        height: 1400,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.magenta}cc 0%, ${C.magenta2}99 60%, transparent 100%)`,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        filter: "blur(2px)",
      }} />
    </AbsoluteFill>
  );
};

// ─── Poster scene ─────────────────────────────────────────
const PosterScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: TOTAL } = useVideoConfig();

  // Noise parallax — more vertical drift for portrait
  const nx = noise2D("vx", frame * 0.003, 0) * 5;
  const ny = noise2D("vy", 0, frame * 0.003) * 9;

  // Zoom: strong entrance zoom, holds, gentle zoom at end
  const scale = interpolate(
    frame,
    [0, Math.round(0.5 * fps), TOTAL - Math.round(1.5 * fps), TOTAL],
    [1.5, 1.0, 1.0, 1.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_ENTER }
  );

  const imgOpacity = interpolate(frame, [0, Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_ENTER,
  });

  // CTA glow pulse at 5s
  const ctaStart = Math.round(5 * fps);
  const ctaPulse = frame >= ctaStart
    ? 1 + Math.sin(((frame - ctaStart) / fps) * Math.PI * 1.5) * 0.06
    : 1;
  const ctaOpacity = interpolate(frame, [ctaStart, ctaStart + Math.round(0.4 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_ENTER,
  });

  // ── BLINDS: 8 strips, staggered every 0.12s ──
  // Start at 0.6s, each strip is ~13% of height, alternating L/R
  const STRIPS = 8;
  const stripH = 100 / STRIPS;
  const BLIND_START = 0.6;
  const BLIND_GAP   = 0.1; // seconds between each strip

  // ── SPOTLIGHT at 2.8s (after blinds) ──
  const SPOT_START = 2.8;

  // ── Detail reveals: 3 horizontal bands after spotlight (3.5s) ──
  const DETAIL_START = 3.5;
  const DETAIL_GAP   = 0.22;
  const detailBands = [
    { topPct: 0,  h: 33, color: C.blue,    goLeft: false },
    { topPct: 33, h: 34, color: C.purple,   goLeft: true  },
    { topPct: 67, h: 33, color: C.magenta2, goLeft: false },
  ];

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>

      {/* ── IMAGE ── */}
      <AbsoluteFill style={{
        opacity: imgOpacity,
        transform: `scale(${scale}) translate(${nx}px, ${ny}px)`,
        transformOrigin: "center center",
      }}>
        {/* Blurred fill for top/bottom letterbox */}
        <Img src={staticFile("vertical.png")} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          filter: "blur(28px) brightness(1.05)",
          transform: "scale(1.08)",
        }} />
        {/* Full poster */}
        <Img src={staticFile("vertical.png")} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain",
        }} />
      </AbsoluteFill>

      {/* ════════════════════════════════════
          PHASE 1 — VENETIAN BLINDS
          8 strips alternating left / right
      ════════════════════════════════════ */}
      {Array.from({ length: STRIPS }, (_, i) => (
        <Blind
          key={i}
          frame={frame}
          fps={fps}
          startSec={BLIND_START + i * BLIND_GAP}
          durSec={0.26}
          color={COLORS[i % COLORS.length]}
          topPct={i * stripH}
          heightPct={stripH + 0.3} // +0.3 to avoid hairline gaps
          goLeft={i % 2 === 0}
        />
      ))}

      {/* ════════════════════════════════════
          PHASE 2 — SPOTLIGHT BURST
          Magenta circle expands + collapses
      ════════════════════════════════════ */}
      <Spotlight frame={frame} fps={fps} startSec={SPOT_START} />

      {/* ════════════════════════════════════
          PHASE 3 — 3 DETAIL BANDS
      ════════════════════════════════════ */}
      {detailBands.map((b, i) => (
        <Blind
          key={`d${i}`}
          frame={frame}
          fps={fps}
          startSec={DETAIL_START + i * DETAIL_GAP}
          durSec={0.24}
          color={b.color}
          topPct={b.topPct}
          heightPct={b.h + 0.3}
          goLeft={b.goLeft}
        />
      ))}

      {/* ── CTA GLOW ── */}
      <div style={{
        position: "absolute",
        bottom: 220,
        left: "50%",
        transform: `translateX(-50%) scale(${ctaPulse})`,
        width: 300,
        height: 300,
        borderRadius: "50%",
        border: `4px solid ${C.magenta}`,
        boxShadow: `0 0 ${20 + ctaPulse * 30}px ${C.magenta}88`,
        opacity: ctaOpacity * 0.85,
        transformOrigin: "center center",
        pointerEvents: "none",
      }} />

    </AbsoluteFill>
  );
};

// ─── Root ─────────────────────────────────────────────────
export const KinderhausArcheVertical = () => {
  const { fps } = useVideoConfig();
  const SCENE_SEC = 12;
  const LEAK_SEC  = 0.93;

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={Math.round(SCENE_SEC * fps)}>
        <PosterScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Overlay
        durationInFrames={Math.round(LEAK_SEC * fps)}
        offset={-Math.round(LEAK_SEC * fps)}
      >
        <LightLeak durationInFrames={Math.round(LEAK_SEC * fps)} seed={7} hueShift={330} />
      </TransitionSeries.Overlay>
    </TransitionSeries>
  );
};
