"use client";

import { useMemo } from "react";
import type { Point01, PointSvg } from "@/lib/snake-similarity-css";
import {
  affinityToCssMatrix,
  similarityAffine,
  withChordSquash,
} from "@/lib/snake-similarity-css";

/** Matches `top-view-striped-snake.svg` intrinsic layout (after optional viewBox edits). */
export const STRIPED_SNAKE_SVG = {
  src: "/top-view-striped-snake.svg",
  width: 670,
  height: 2000,
} as const;

type Props = {
  /** Tail matches this normalized cell centre (overlay). */
  tailOnBoard: Point01;
  /** Head matches this normalized cell centre (overlay). */
  headOnBoard: Point01;
  /** Tail anchor inside source SVG coords (narrow / tail end). Tweak visually if alignment is off. */
  svgTail?: PointSvg;
  /** Head anchor inside source SVG coords. */
  svgHead?: PointSvg;
  overlayWidthPx: number;
  overlayHeightPx: number;
  className?: string;
  opacity?: number;
  /** <1 — тонше по ширині (стискання ⟂ до лінії голова–хвіст), кінці якорів зберігаються. */
  chordSquash?: number;
  /** CSS `filter` для кольору / тону (наприклад `hue-rotate(...)`). */
  imgFilter?: string;
};

/** У арті голова знизу (велика y), тонкий хвіст зверху — не плутати з «географічним» топом файлу. */
const DEFAULT_SVG_TAIL: PointSvg = { x: 486, y: 155 };
const DEFAULT_SVG_HEAD: PointSvg = { x: 289, y: 1829 };

export function StripedSnakeOverlay({
  tailOnBoard,
  headOnBoard,
  svgTail = DEFAULT_SVG_TAIL,
  svgHead = DEFAULT_SVG_HEAD,
  overlayWidthPx,
  overlayHeightPx,
  className = "",
  opacity = 0.94,
  chordSquash = 1,
  imgFilter,
}: Props) {
  const matrix = useMemo(() => {
    if (overlayWidthPx < 8 || overlayHeightPx < 8) return "none";

    const Bt = { x: tailOnBoard.x * overlayWidthPx, y: tailOnBoard.y * overlayHeightPx };
    const Bh = { x: headOnBoard.x * overlayWidthPx, y: headOnBoard.y * overlayHeightPx };

    let aff = similarityAffine({
      svgTail,
      svgHead,
      overlayTailPx: Bt,
      overlayHeadPx: Bh,
    });
    aff = withChordSquash(aff, Bt, Bh, chordSquash);
    return affinityToCssMatrix(aff);
  }, [
    overlayWidthPx,
    overlayHeightPx,
    tailOnBoard,
    headOnBoard,
    svgHead,
    svgTail,
    chordSquash,
  ]);

  if (matrix === "none") return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-visible ${className}`} aria-hidden>
      {/* SVG + довільний matrix(); next/image це не підтримує зручно */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STRIPED_SNAKE_SVG.src}
        alt=""
        width={STRIPED_SNAKE_SVG.width}
        height={STRIPED_SNAKE_SVG.height}
        draggable={false}
        className="pointer-events-none select-none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity,
          filter: imgFilter,
          transform: matrix,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}
