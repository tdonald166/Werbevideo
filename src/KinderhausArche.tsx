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

// ─── Easing ───────────────────────────────────────────────
const EO  = Easing.bezier(0.16, 1, 0.3, 1);
const EIN = Easing.bezier(0.55, 0, 1, 0.45);
const EI  = Easing.bezier(0.45, 0, 0.55, 1);
const ELASTIC = Easing.bezier(0.68, -0.55, 0.27, 1.55);
const SMOOTH = Easing.bezier(0.4, 0.0, 0.2, 1);

const MAGENTA = "#be0072";

const ci = (
  f: number,
  [s, e]: [number, number],
  [a, b]: [number, number],
  ease = EI,
) =>
  interpolate(f, [s, e], [a, b], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

// ─── SCENE 1: Emotional Intro (0–3s / 0-90 frames) ─────────
const Scene1_ChildrenIntro = ({ frame }: { frame: number }) => {
  const START = 0;
  const END = 90;

  if (frame >= END) return null;

  const opacity = ci(frame, [START, START + 15], [0, 1], EO);
  const zoom = ci(frame, [START, END], [1.0, 1.1], SMOOTH);
  const blur = ci(frame, [START, START + 20], [8, 0], EO);

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: `blur(${blur}px)`,
      }}
    >
      <Img
        src={staticFile("image 1 (2).png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── SCENE 2: Title Reveal (3–6s / 90-180 frames) ─────────
const Scene2_TitleReveal = ({ frame }: { frame: number }) => {
  const START = 90;
  const END = 180;

  if (frame < START || frame >= END) return null;

  const frameInScene = frame - START;
  const opacity = ci(frameInScene, [0, 20], [0, 1], EO);
  const translateY = ci(frameInScene, [0, 30], [80, 0], EO);
  const scale = ci(frameInScene, [0, 30], [0.95, 1.05], EO);

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("image 1 (4).png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── SCENE 3: Message Highlight – Mask Reveal (6–9s / 180-270 frames) ─────────
const Scene3_MessageReveal = ({ frame }: { frame: number }) => {
  const START = 180;
  const END = 270;

  if (frame < START || frame >= END) return null;

  const frameInScene = frame - START;
  const maskProgress = ci(frameInScene, [0, 60], [0, 1], EO);
  const opacity = ci(frameInScene, [0, 15], [0, 1], EO);
  const glowIntensity = ci(frameInScene, [20, 60], [0, 0.3], SMOOTH);

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <Img
        src={staticFile("image 1 (3).png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          mask: `linear-gradient(90deg, 
            rgba(0,0,0,0) 0%, 
            rgba(0,0,0,1) ${maskProgress * 100}%, 
            rgba(0,0,0,1) 100%)`,
        }}
      />
      {/* Glow effect */}
      {glowIntensity > 0.1 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(190, 0, 114, ${glowIntensity * 0.2}) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ─── SCENE 4: Services Icons with Stagger (9–12s / 270-360 frames) ─────────
const Scene4_ServicesStagger = ({ frame }: { frame: number }) => {
  const START = 270;
  const END = 360;

  if (frame < START || frame >= END) return null;

  const frameInScene = frame - START;
  const containerOpacity = ci(frameInScene, [0, 15], [0, 1], EO);

  return (
    <AbsoluteFill style={{ opacity: containerOpacity }}>
      <Img
        src={staticFile("image 1 (1).png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${ci(frameInScene, [0, 30], [0.98, 1.02], SMOOTH)})`,
        }}
      />
      {/* Subtle pulse on icons */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(190, 0, 114, ${Math.sin(frameInScene * 0.1) * 0.1 + 0.05}) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── SCENE 5: CTA Focus with Pulse (12–15s / 360-450 frames) ─────────
const Scene5_CtaFocus = ({ frame }: { frame: number }) => {
  const START = 360;
  const END = 450;

  if (frame < START || frame >= END) return null;

  const frameInScene = frame - START;
  const opacity = ci(frameInScene, [0, 15], [0, 1], EO);
  const zoom = ci(frameInScene, [0, 60], [1.0, 1.15], SMOOTH);
  const pulse = 1 + Math.sin(frameInScene * 0.05) * 0.02;
  const fadeOut = ci(frameInScene, [70, 90], [1, 0], EIN);

  return (
    <AbsoluteFill
      style={{
        opacity: opacity * fadeOut,
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("image 1 (5).png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom * pulse})`,
          transformOrigin: "50% 60%",
        }}
      />
      {/* Darker overlay for focus */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 60%, rgba(190, 0, 114, 0) 0%, rgba(0, 0, 0, ${0.3 * opacity}) 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── FINAL FADE TO BLACK ─────────────────────────────────
const FadeToBlack = ({ frame }: { frame: number }) => {
  const START = 435;
  const END = 450;

  const opacity = ci(frame, [START, END], [0, 1], EIN);

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Root Composition ──────────────────────────────────────
export const KinderhausArche = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      {/* Scene 1: Children emotional intro */}
      <Scene1_ChildrenIntro frame={frame} />

      {/* Scene 2: Title reveal */}
      <Scene2_TitleReveal frame={frame} />

      {/* Scene 3: Message highlight mask reveal */}
      <Scene3_MessageReveal frame={frame} />

      {/* Scene 4: Services with stagger */}
      <Scene4_ServicesStagger frame={frame} />

      {/* Scene 5: CTA focus & pulse */}
      <Scene5_CtaFocus frame={frame} />

      {/* Fade to black */}
      <FadeToBlack frame={frame} />
    </AbsoluteFill>
  );
};
