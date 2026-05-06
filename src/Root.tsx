import React from "react";
import { Composition } from "remotion";
import { AdCinematicH, AdCinematicV } from "./ads/AdCinematic";
import { AdHorizontal } from "./ads/AdHorizontal";
import { AdVertical } from "./ads/AdVertical";
import { AdNeonH, AdNeonV } from "./ads/AdNeon";
import { adConfigs } from "./ads/configs.gen";

export const RemotionRoot = () => {
  return (
    <>
      {adConfigs.map((cfg) => (
        <React.Fragment key={cfg.id}>
          <Composition
            id={`${cfg.id}-cinematic-h`}
            component={AdCinematicH}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ config: cfg }}
          />
          <Composition
            id={`${cfg.id}-cinematic-v`}
            component={AdCinematicV}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{ config: cfg }}
          />
          <Composition
            id={`${cfg.id}-h`}
            component={AdHorizontal}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ config: cfg }}
          />
          <Composition
            id={`${cfg.id}-v`}
            component={AdVertical}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{ config: cfg }}
          />
          <Composition
            id={`${cfg.id}-neon-h`}
            component={AdNeonH}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ config: cfg }}
          />
          <Composition
            id={`${cfg.id}-neon-v`}
            component={AdNeonV}
            durationInFrames={(cfg.duration ?? 15) * 30}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{ config: cfg }}
          />
        </React.Fragment>
      ))}
    </>
  );
};
