import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

type Props = {
  posterUrl: string;
  title: string;
  subtitle: string;
};

export const PosterVideo = ({ posterUrl, title, subtitle }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imageScale = interpolate(frame, [0, 30], [1.08, 1], { extrapolateRight: "clamp" });

  const titleOpacity = spring({ frame: frame - 20, fps, config: { damping: 20 } });
  const titleY = interpolate(titleOpacity, [0, 1], [40, 0]);

  const subtitleOpacity = spring({ frame: frame - 40, fps, config: { damping: 20 } });
  const subtitleY = interpolate(subtitleOpacity, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {posterUrl ? (
        <AbsoluteFill
          style={{
            transform: `scale(${imageScale})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={posterUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" }} />
      )}

      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px 80px",
        }}
      >
        {title && (
          <div
            style={{
              color: "#fff",
              fontSize: 72,
              fontWeight: 800,
              fontFamily: "sans-serif",
              lineHeight: 1.1,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              marginBottom: 16,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 36,
              fontFamily: "sans-serif",
              fontWeight: 400,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
