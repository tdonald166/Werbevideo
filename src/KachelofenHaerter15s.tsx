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
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: OSWALD } = loadOswald();
const { fontFamily: INTER }  = loadInter();

// ─── Brand colors ─────────────────────────────────────────
const BLACK    = "#0a0a0a";
const BLACK_2  = "#1a1410";
const GOLD     = "#d4af37";
const GOLD_HI  = "#f5d56e";
const RED      = "#c41e1e";
const WHITE    = "#ffffff";
const EMBER    = "#ff7a18";

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

// ─── Floating ember particles (background atmosphere) ─────
const Embers = ({ frame }: { frame: number }) => {
  const PARTICLES = 28;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const seed = i + 1;
        const startX  = random(`x-${seed}`) * 1920;
        const speed   = 0.6 + random(`s-${seed}`) * 1.2;
        const drift   = (random(`d-${seed}`) - 0.5) * 200;
        const size    = 2 + random(`r-${seed}`) * 4;
        const phase   = random(`p-${seed}`) * 200;
        const lifeY   = ((frame * speed + phase) % 1200) - 100;
        const yPos    = 1080 - lifeY;
        const xPos    = startX + Math.sin((frame + phase) * 0.04) * drift;
        const op      = Math.sin((lifeY / 1200) * Math.PI) * 0.7;
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

// ─── Brushstroke banner (red painted stroke style) ────────
const BrushBanner: React.FC<{
  children: React.ReactNode;
  bg?: string;
  width?: number;
  height?: number;
}> = ({ children, bg = RED, width = 800, height = 90 }) => (
  <div style={{
    position: "relative",
    width, height,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0 }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <path
        d={`M 8 ${height * 0.55}
            Q ${width * 0.1} ${height * 0.15}, ${width * 0.3} ${height * 0.35}
            T ${width * 0.7} ${height * 0.4}
            T ${width - 8} ${height * 0.5}
            L ${width - 14} ${height * 0.85}
            Q ${width * 0.7} ${height * 0.95}, ${width * 0.5} ${height * 0.8}
            T ${width * 0.15} ${height * 0.85}
            Z`}
        fill={bg}
        filter="url(#rough)"
      />
    </svg>
    <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
  </div>
);

// ─── Animated Fireplace (SVG) ─────────────────────────────
const Fireplace: React.FC<{ frame: number; width?: number; height?: number }> = ({
  frame, width = 720, height = 520,
}) => {
  const flicker  = Math.sin(frame * 0.35) * 0.06 + Math.sin(frame * 0.9) * 0.03;
  const flicker2 = Math.cos(frame * 0.42) * 0.05 + Math.sin(frame * 1.3) * 0.02;
  const f1 = 1 + flicker;
  const f2 = 1 + flicker2;
  const emberGlow = 0.85 + Math.sin(frame * 0.5) * 0.15;

  return (
    <svg width={width} height={height} viewBox="0 0 720 520">
      <defs>
        {/* Stone wall gradient */}
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1a1410" />
          <stop offset="100%" stopColor="#0d0907" />
        </linearGradient>
        {/* Fireplace surround */}
        <linearGradient id="surround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#2a201a" />
          <stop offset="50%" stopColor="#181210" />
          <stop offset="100%" stopColor="#0a0807" />
        </linearGradient>
        {/* Glass reflection */}
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
        {/* Fire glow inside */}
        <radialGradient id="fireGlow" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%"   stopColor="#fff4b0" stopOpacity="1" />
          <stop offset="20%"  stopColor="#ffb347" stopOpacity="1" />
          <stop offset="50%"  stopColor="#ff5a14" stopOpacity="0.95" />
          <stop offset="80%"  stopColor="#7a1a06" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a0703" stopOpacity="0" />
        </radialGradient>
        {/* Flame core gradient */}
        <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"  stopColor="#fff8c0" />
          <stop offset="35%" stopColor="#ffb347" />
          <stop offset="70%" stopColor="#ff5a14" />
          <stop offset="100%" stopColor="#ff5a14" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flameDark" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"  stopColor="#ffb347" />
          <stop offset="60%" stopColor="#c41e1e" />
          <stop offset="100%" stopColor="#c41e1e" stopOpacity="0" />
        </linearGradient>
        {/* Hearth shadow */}
        <radialGradient id="floorGlow" cx="0.5" cy="0" r="0.8">
          <stop offset="0%"  stopColor="#ff8a30" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff8a30" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Wall behind */}
      <rect width="720" height="520" fill="url(#wall)" />

      {/* Stone wall texture lines */}
      <g opacity="0.15" stroke="#3a2a1e" strokeWidth="1">
        <line x1="0" y1="80"  x2="720" y2="80"  />
        <line x1="0" y1="160" x2="720" y2="160" />
        <line x1="0" y1="240" x2="720" y2="240" />
        <line x1="120" y1="0" x2="120" y2="80" />
        <line x1="280" y1="80" x2="280" y2="160" />
        <line x1="440" y1="0" x2="440" y2="80" />
        <line x1="600" y1="80" x2="600" y2="160" />
      </g>

      {/* Outer fireplace surround (mantle) */}
      <rect x="60" y="40" width="600" height="440" rx="6" fill="url(#surround)" />
      <rect x="60" y="40" width="600" height="14" fill="#2a1f18" />
      <rect x="60" y="466" width="600" height="14" fill="#1a1208" />

      {/* Inner opening — black firebox */}
      <rect x="120" y="100" width="480" height="340" rx="4" fill="#000" />

      {/* Fire glow background inside firebox */}
      <ellipse
        cx="360" cy="380"
        rx={260 * f1}
        ry={220 * f2}
        fill="url(#fireGlow)"
        opacity={emberGlow}
      />

      {/* Logs (bottom) */}
      <g>
        {/* back log */}
        <ellipse cx="360" cy="410" rx="160" ry="14" fill="#2a1208" />
        <ellipse cx="360" cy="408" rx="155" ry="11" fill="#1a0904" />
        {/* glowing cracks on back log */}
        <path d="M250 408 Q300 405 360 410 T470 408"
          stroke="#ff5a14" strokeWidth="2" fill="none" opacity={emberGlow} />
        {/* front log */}
        <ellipse cx="360" cy="425" rx="180" ry="12" fill="#180704" />
        <path d="M210 425 Q280 420 360 426 T510 423"
          stroke="#ff8a30" strokeWidth="2.5" fill="none" opacity={emberGlow * 0.9} />
        {/* embers underneath */}
        <ellipse cx="360" cy="438" rx="200" ry="6" fill="#ff5a14" opacity={emberGlow * 0.4} />
      </g>

      {/* Flames — back layer */}
      <g style={{ transformOrigin: "360px 420px", transform: `scaleY(${f2})` }}>
        <path
          d={`M 240 420
              Q 230 ${360 + flicker * 20} 270 ${300 + flicker2 * 25}
              Q 290 ${260 + flicker * 30} 310 ${290 + flicker * 20}
              Q 320 ${250 + flicker2 * 25} 360 ${230 + flicker * 30}
              Q 400 ${260 + flicker2 * 20} 410 ${290 + flicker * 25}
              Q 430 ${260 + flicker * 25} 450 ${300 + flicker2 * 20}
              Q 490 ${360 + flicker2 * 20} 480 420 Z`}
          fill="url(#flameDark)"
          opacity="0.85"
        />
      </g>

      {/* Flames — main layer */}
      <g style={{ transformOrigin: "360px 425px", transform: `scaleY(${f1})` }}>
        <path
          d={`M 270 425
              Q 270 ${380 + flicker * 15} 295 ${340 + flicker2 * 20}
              Q 315 ${300 + flicker * 25} 335 ${320 + flicker * 15}
              Q 345 ${280 + flicker2 * 20} 360 ${260 + flicker * 25}
              Q 375 ${280 + flicker2 * 15} 385 ${320 + flicker * 20}
              Q 405 ${300 + flicker * 20} 425 ${340 + flicker2 * 15}
              Q 450 ${380 + flicker2 * 15} 450 425 Z`}
          fill="url(#flame)"
        />
      </g>

      {/* Flames — bright tip (yellow core) */}
      <g style={{ transformOrigin: "360px 425px", transform: `scaleY(${f1 * 0.95})` }}>
        <path
          d={`M 320 425
              Q 325 ${380 + flicker * 10} 345 ${350 + flicker2 * 15}
              Q 358 ${315 + flicker * 20} 360 ${300 + flicker * 15}
              Q 365 ${315 + flicker2 * 15} 375 ${350 + flicker * 15}
              Q 395 ${380 + flicker2 * 10} 400 425 Z`}
          fill="#fff8c0"
          opacity={0.85 + Math.sin(frame * 0.6) * 0.12}
        />
      </g>

      {/* Glass front reflection */}
      <rect x="120" y="100" width="480" height="340" rx="4" fill="url(#glass)" />
      <rect x="120" y="100" width="480" height="340" rx="4"
        fill="none" stroke="#3a2a1e" strokeWidth="2" />

      {/* Floor glow / hearth light spill */}
      <ellipse cx="360" cy="490" rx="340" ry="30" fill="url(#floorGlow)" />

      {/* Hearth base */}
      <rect x="40" y="480" width="640" height="20" fill="#0a0604" />
    </svg>
  );
};

// ─── SCENE 1 — Hook (0–3.5s / 0–105f) ─────────────────────
const SceneHook = ({ frame }: { frame: number }) => {
  const START = 0, END = 105;
  if (frame >= END) return null;

  const flicker = 1 + Math.sin(frame * 0.4) * 0.04 + Math.sin(frame * 1.1) * 0.02;
  const glowPulse = 60 + Math.sin(frame * 0.25) * 30;

  const titleOp  = ci(frame, [0, 18], [0, 1], EO);
  const titleY   = ci(frame, [0, 22], [40, 0], EO);
  const subOp    = ci(frame, [22, 42], [0, 1], EO);
  const subY     = ci(frame, [22, 42], [30, 0], EO);
  const bannerOp = ci(frame, [42, 58], [0, 1], EO);
  const bannerSc = ci(frame, [42, 62], [0.85, 1], POP);
  const badgeOp  = ci(frame, [12, 32], [0, 1], EO);
  const badgeSc  = ci(frame, [12, 36], [0, 1], POP);
  const exit     = ci(frame, [END - 18, END], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 70% 60%, #2a1a0a 0%, ${BLACK} 65%)`,
      opacity: exit,
    }}>
      {/* Fire glow on right */}
      <div style={{
        position: "absolute",
        right: -200, top: "50%",
        width: 900, height: 900,
        borderRadius: "50%",
        transform: "translateY(-50%)",
        background: `radial-gradient(circle, ${EMBER}55 0%, transparent 60%)`,
        filter: `blur(${40 * flicker}px)`,
        opacity: 0.9 * flicker,
      }} />

      {/* Real fireplace photo on right with Ken Burns */}
      <div style={{
        position: "absolute",
        right: 80, top: 110,
        width: 720, height: 720,
        transform: `scale(${ci(frame, [0, 30], [0.92, 1], EO)})`,
        opacity: ci(frame, [0, 25], [0, 1], EO),
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 20px 80px ${EMBER}55, 0 0 0 2px ${GOLD}55`,
      }}>
        <Img src={staticFile("kamine.webp")} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${ci(frame, [0, 105], [1.0, 1.08], EI)})`,
          transformOrigin: "center 60%",
          filter: `brightness(${1 + flicker * 0.08}) saturate(1.15)`,
        }} />
        {/* Warm overlay */}
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.4) 100%)`,
          pointerEvents: "none",
        }} />
      </div>

      <Embers frame={frame} />

      {/* Logo top-left */}
      <div style={{
        position: "absolute",
        top: 50, left: 100,
        opacity: ci(frame, [0, 20], [0, 1], EO),
        transform: `translateY(${ci(frame, [0, 24], [-30, 0], EO)}px)`,
        background: "rgba(232,115,28,0.95)",
        padding: "12px 24px",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <Img src={staticFile("image.png")} style={{
          height: 70, width: "auto", display: "block",
        }} />
      </div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: 200, left: 100,
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
      }}>
        <div style={{
          fontFamily: OSWALD,
          fontWeight: 900, fontSize: 110,
          color: WHITE, lineHeight: 1.0,
          letterSpacing: -1,
          textShadow: `0 0 ${glowPulse}px ${EMBER}aa, 0 6px 30px rgba(0,0,0,0.6)`,
        }}>
          FEUER & WÄRME
        </div>
        <div style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontFamily: OSWALD,
          fontWeight: 900, fontSize: 92,
          background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD} 50%, #a8842a 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -1, marginTop: 4,
          filter: `drop-shadow(0 4px 16px ${GOLD}66)`,
        }}>
          ZUM WOHLFÜHLEN?
        </div>
      </div>

      {/* Red brush banner */}
      <div style={{
        position: "absolute",
        top: 460, left: 100,
        opacity: bannerOp,
        transform: `scale(${bannerSc})`,
        transformOrigin: "left center",
      }}>
        <BrushBanner bg={RED} width={920} height={150}>
          <div style={{
            fontFamily: OSWALD,
            fontWeight: 900, fontSize: 64,
            color: WHITE, letterSpacing: -1,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            lineHeight: 1.0, padding: "0 30px",
          }}>
            WIR SCHAFFEN IHREN<br />PLATZ AM FEUER!
          </div>
        </BrushBanner>
      </div>

      {/* 20 Jahre badge */}
      <div style={{
        position: "absolute",
        top: 100, right: 120,
        opacity: badgeOp,
        transform: `scale(${badgeSc}) rotate(-8deg)`,
        transformOrigin: "center center",
        width: 240, height: 240,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${GOLD_HI} 0%, ${GOLD} 60%, #8a6a1a 100%)`,
        boxShadow: `0 0 60px ${GOLD}aa, inset 0 0 40px rgba(0,0,0,0.3)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: OSWALD,
        color: BLACK, textAlign: "center",
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>ÜBER</div>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.9 }}>20</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>JAHRE</div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>ERFAHRUNG</div>
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2 — Werte: Individuell · Meisterhaft · Nachhaltig (3.5–7s) ─
const Check = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke={GOLD} strokeWidth="2" fill="none" />
    <path d="M7 12.5l3.5 3.5L17 9" stroke={GOLD} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Star = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke={GOLD} strokeWidth="2" fill="none" />
    <path d="M12 6.5l1.85 3.75 4.15.6-3 2.92.7 4.13L12 15.95l-3.7 1.95.7-4.13-3-2.92 4.15-.6L12 6.5z"
      fill={GOLD} />
  </svg>
);
const Leaf = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke={GOLD} strokeWidth="2" fill="none" />
    <path d="M7 17c0-5 3-9 10-10-1 7-5 10-10 10zM9 15c2-3 4-5 7-6"
      stroke={GOLD} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const VALUES = [
  { Icon: Check, title: "INDIVIDUELL.",   desc: "Maßgeschneiderte Lösungen für Ihr Zuhause." },
  { Icon: Star,  title: "MEISTERHAFT.",   desc: "Erfahrung, Präzision und höchste Qualität." },
  { Icon: Leaf,  title: "NACHHALTIG.",    desc: "Effiziente Technologien für eine bessere Zukunft." },
];

const SceneValues = ({ frame }: { frame: number }) => {
  const START = 105, END = 210;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 16, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 60%, ${BLACK_2} 0%, ${BLACK} 70%)`,
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 50,
    }}>
      <Embers frame={frame} />

      <div style={{
        opacity: ci(f, [4, 20], [0, 1], EO),
        transform: `translateY(${ci(f, [4, 24], [30, 0], EO)}px)`,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: OSWALD,
          fontSize: 56, color: WHITE, letterSpacing: -1,
        }}>
          UNSERE VERSPRECHEN
        </div>
        <div style={{
          width: 100, height: 4,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          margin: "14px auto 0",
        }} />
      </div>

      <div style={{ display: "flex", gap: 100, marginTop: 20 }}>
        {VALUES.map((v, i) => {
          const sStart = 24 + i * 14;
          const op = ci(f, [sStart, sStart + 20], [0, 1], EO);
          const ty = ci(f, [sStart, sStart + 24], [50, 0], EO);
          const sc = ci(f, [sStart, sStart + 26], [0.85, 1], POP);
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              textAlign: "center", width: 340,
            }}>
              <div style={{
                width: 110, height: 110, borderRadius: "50%",
                background: `radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)`,
                margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <v.Icon size={88} />
              </div>
              <div style={{
                fontFamily: OSWALD,
                fontSize: 32, color: WHITE, letterSpacing: 1,
                marginBottom: 10,
              }}>
                {v.title}
              </div>
              <div style={{
                fontFamily: INTER, fontSize: 19,
                color: "rgba(255,255,255,0.8)", lineHeight: 1.5,
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

// ─── SCENE 3 — Services (7–11s) ───────────────────────────
const SvcKachel = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="1" stroke={GOLD} strokeWidth="2" />
    <line x1="5" y1="9"  x2="19" y2="9"  stroke={GOLD} strokeWidth="1.5" />
    <line x1="5" y1="15" x2="19" y2="15" stroke={GOLD} strokeWidth="1.5" />
    <line x1="12" y1="3" x2="12" y2="21" stroke={GOLD} strokeWidth="1.5" />
  </svg>
);
const SvcKamin = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="14" rx="1" stroke={GOLD} strokeWidth="2" />
    <rect x="6" y="9" width="12" height="8" stroke={GOLD} strokeWidth="1.5" />
    <path d="M12 11c1 1.5 0 2.5 0 3.5M11 14c.5-1 1-1 1-2"
      stroke={EMBER} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);
const SvcPellet = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
    <rect x="7" y="3" width="10" height="18" rx="1" stroke={GOLD} strokeWidth="2" />
    <path d="M11 11c.5-1 .5-2 0-3 1 .5 1.5 1.5 1.5 2.5s-.5 2-1.5 2.5z"
      fill={EMBER} stroke={EMBER} strokeWidth="0.5" />
    <line x1="9" y1="17" x2="15" y2="17" stroke={GOLD} strokeWidth="1.5" />
  </svg>
);
const SvcPlan = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
    <path d="M5 4h11l3 3v13H5z" stroke={GOLD} strokeWidth="2" />
    <path d="M16 4v3h3M8 12h8M8 16h6" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SERVICES = [
  { Icon: SvcKachel, title: "KACHELÖFEN",            desc: "Individuelle Planung & Bau Ihrer Wärmequelle." },
  { Icon: SvcKamin,  title: "HEIZKAMINE",            desc: "Effiziente, sichtbare Feuerwärme im Design." },
  { Icon: SvcPellet, title: "KAMIN- & PELLETÖFEN",   desc: "Moderne, flexible Lösungen für Ihr Heim." },
  { Icon: SvcPlan,   title: "PLANUNG & BERATUNG",    desc: "Von der Idee bis zur Inbetriebnahme." },
];

const SceneServices = ({ frame }: { frame: number }) => {
  const START = 210, END = 330;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);
  const exit = ci(f, [END - START - 16, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, #2a1a0a 0%, ${BLACK} 70%)`,
      opacity: bgOp * exit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 40,
    }}>
      {/* Gold banner header */}
      <div style={{
        opacity: ci(f, [4, 22], [0, 1], EO),
        transform: `translateY(${ci(f, [4, 24], [40, 0], EO)}px)`,
      }}>
        <div style={{
          padding: "16px 60px",
          background: `linear-gradient(90deg, ${GOLD_HI} 0%, ${GOLD} 50%, #8a6a1a 100%)`,
          borderRadius: 4,
          fontFamily: OSWALD,
          fontSize: 44, color: BLACK,
          letterSpacing: 1,
          boxShadow: `0 0 40px ${GOLD}77`,
        }}>
          KACHELÖFEN HÄRTER
        </div>
        <div style={{
          fontFamily: INTER, fontWeight: 700,
          fontSize: 18, color: GOLD, textAlign: "center",
          marginTop: 10, letterSpacing: 2,
        }}>
          KACHELOFENBAU · MEISTERBETRIEB · SEIT ÜBER 20 JAHREN
        </div>
      </div>

      <div style={{ display: "flex", gap: 50, marginTop: 30 }}>
        {SERVICES.map((s, i) => {
          const sStart = 22 + i * 11;
          const op  = ci(f, [sStart, sStart + 18], [0, 1], EO);
          const ty  = ci(f, [sStart, sStart + 22], [40, 0], EO);
          const sc  = ci(f, [sStart, sStart + 24], [0.8, 1], POP);
          const glow = 14 + Math.sin((f - sStart) * 0.15) * 6;
          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${ty}px) scale(${sc})`,
              textAlign: "center", width: 240,
              padding: "28px 16px",
              border: `1.5px solid ${GOLD}55`,
              borderRadius: 10,
              background: "rgba(20,15,8,0.5)",
              boxShadow: `0 0 ${glow}px ${GOLD}33, inset 0 0 30px rgba(212,175,55,0.05)`,
            }}>
              <div style={{
                width: 96, height: 96,
                margin: "0 auto 14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                filter: `drop-shadow(0 0 8px ${GOLD}77)`,
              }}>
                <s.Icon />
              </div>
              <div style={{
                fontFamily: OSWALD,
                fontSize: 22, color: WHITE, letterSpacing: 0.5,
                marginBottom: 10, lineHeight: 1.2,
              }}>
                {s.title}
              </div>
              <div style={{
                fontFamily: INTER, fontSize: 15,
                color: "rgba(255,255,255,0.8)", lineHeight: 1.4,
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

// ─── SCENE 4 — CTA (11–15s) ───────────────────────────────
const Phone = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={BLACK} stroke={GOLD} strokeWidth="2" />
    <path d="M8 7c0 6 3 9 9 9l-1.5 2.5c-.5.8-1.5 1-2.3.7C8.7 17.5 6.5 15.3 4.8 10.8c-.3-.8-.1-1.8.7-2.3L8 7z"
      fill={GOLD} />
  </svg>
);
const Pin = ({ size = 36, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2c4 0 7 3 7 7 0 5-7 13-7 13S5 14 5 9c0-4 3-7 7-7z"
      stroke={color} strokeWidth="2" fill="rgba(212,175,55,0.15)" />
    <circle cx="12" cy="9" r="2.5" fill={color} />
  </svg>
);

const SceneCTA = ({ frame }: { frame: number }) => {
  const START = 330, END = 450;
  if (frame < START || frame >= END) return null;
  const f = frame - START;

  const bgOp = ci(f, [0, 14], [0, 1], EO);

  const headOp = ci(f, [6, 26], [0, 1], EO);
  const headY  = ci(f, [6, 28], [30, 0], EO);

  const phoneOp = ci(f, [22, 42], [0, 1], EO);
  const phoneSc = ci(f, [22, 48], [0.6, 1], POP);

  const addrOp = ci(f, [44, 62], [0, 1], EO);
  const addrY  = ci(f, [44, 62], [20, 0], EO);

  const sloganOp = ci(f, [60, 80], [0, 1], EO);

  // Phone glow pulse
  const glow = 30 + Math.sin(f * 0.18) * 18;
  const phonePulse = 1 + Math.sin(f * 0.18) * 0.025;

  const fade = ci(f, [END - START - 12, END - START], [1, 0], EIN);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, #2a1a0a 0%, ${BLACK} 70%)`,
      opacity: bgOp * fade,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>
      {/* Background fireplace photo (subtle, blurred) */}
      <AbsoluteFill style={{ opacity: 0.25 }}>
        <Img src={staticFile("kamine1.webp")} style={{
          width: "100%", height: "100%", objectFit: "cover",
          filter: "blur(8px) brightness(0.5) saturate(1.3)",
          transform: `scale(${ci(f, [0, 120], [1.0, 1.1], EI)})`,
        }} />
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(196,30,30,0.2) 0%, rgba(0,0,0,0.7) 80%)`,
        }} />
      </AbsoluteFill>

      <Embers frame={frame} />

      {/* Logo top-center */}
      <div style={{
        position: "absolute",
        top: 50, left: "50%",
        transform: `translateX(-50%) translateY(${ci(f, [0, 20], [-30, 0], EO)}px)`,
        opacity: ci(f, [0, 20], [0, 1], EO),
        background: "rgba(232,115,28,0.95)",
        padding: "10px 24px",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <Img src={staticFile("image.png")} style={{
          height: 56, width: "auto", display: "block",
        }} />
      </div>

      {/* Headline red banner */}
      <div style={{
        opacity: headOp,
        transform: `translateY(${headY}px)`,
      }}>
        <BrushBanner bg={RED} width={620} height={120}>
          <div style={{
            fontFamily: OSWALD,
            fontSize: 56, color: WHITE,
            letterSpacing: -1, textAlign: "center",
            lineHeight: 1.0, padding: "0 30px",
            textShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}>
            JETZT<br />BERATEN LASSEN!
          </div>
        </BrushBanner>
      </div>

      {/* Phone — big, glowing */}
      <div style={{
        opacity: phoneOp,
        transform: `scale(${phoneSc * phonePulse})`,
        display: "flex", alignItems: "center", gap: 24,
        padding: "20px 50px",
        background: "rgba(0,0,0,0.4)",
        border: `2px solid ${GOLD}`,
        borderRadius: 16,
        boxShadow: `0 0 ${glow}px ${GOLD}99, inset 0 0 30px rgba(212,175,55,0.1)`,
      }}>
        <Phone size={88} />
        <div style={{
          fontFamily: OSWALD,
          fontSize: 100, color: WHITE,
          letterSpacing: 2, lineHeight: 1,
          textShadow: `0 0 24px ${GOLD}aa`,
        }}>
          06728 - 753
        </div>
      </div>

      <div style={{
        opacity: phoneOp,
        fontFamily: INTER, fontWeight: 800,
        fontSize: 22, color: GOLD, letterSpacing: 3,
        marginTop: -8,
      }}>
        ANRUFEN & TERMIN SICHERN!
      </div>

      {/* Address */}
      <div style={{
        opacity: addrOp,
        transform: `translateY(${addrY}px)`,
        display: "flex", alignItems: "center", gap: 14,
        marginTop: 18,
        fontFamily: INTER, fontSize: 22,
        color: "rgba(255,255,255,0.9)",
      }}>
        <Pin size={32} />
        <span>Kapellenstraße 32 · 55437 Nieder-Hilbersheim</span>
      </div>

      {/* Slogan */}
      <div style={{
        opacity: sloganOp,
        marginTop: 14,
        fontFamily: OSWALD,
        fontSize: 28, color: GOLD,
        letterSpacing: 3, textAlign: "center",
      }}>
        WIR MACHEN AUS <span style={{ color: EMBER, fontStyle: "italic" }}>FEUER</span> EIN ZUHAUSE.
      </div>
    </AbsoluteFill>
  );
};

// ─── Final fade to black ──────────────────────────────────
const FadeBlack = ({ frame, total }: { frame: number; total: number }) => {
  const op = ci(frame, [total - 8, total], [0, 1], EIN);
  return (
    <AbsoluteFill style={{ background: BLACK, opacity: op, pointerEvents: "none" }} />
  );
};

// ─── Root ─────────────────────────────────────────────────
export const KachelofenHaerter15s = () => {
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
