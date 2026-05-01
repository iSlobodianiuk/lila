/** Normalized coords on board overlay — 0..1 horizontally and vertically. */
export type Point01 = Readonly<{ x: number; y: number }>;

/** Points in intrinsic SVG/document pixel space (`width` / `height` of asset). */
export type PointSvg = Readonly<{ x: number; y: number }>;

/** CSS-compatible affine: x' = a x + c y + e ; y' = b x + d y + f */
export type Affine2D = { a: number; b: number; c: number; d: number; e: number; f: number };

export function affinityToCssMatrix(m: Affine2D): string {
  return `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
}

/** Similarity: хвіст і голова на дошці збігаються з двома якорями в SVG. */
export function similarityAffine(params: {
  svgTail: PointSvg;
  svgHead: PointSvg;
  overlayTailPx: PointSvg;
  overlayHeadPx: PointSvg;
}): Affine2D {
  const { svgTail, svgHead, overlayTailPx, overlayHeadPx } = params;

  const va = { x: svgHead.x - svgTail.x, y: svgHead.y - svgTail.y };
  const vb = { x: overlayHeadPx.x - overlayTailPx.x, y: overlayHeadPx.y - overlayTailPx.y };
  const la = Math.hypot(va.x, va.y) || 1e-9;
  const lb = Math.hypot(vb.x, vb.y) || 1e-9;
  const s = lb / la;
  const angA = Math.atan2(va.y, va.x);
  const angB = Math.atan2(vb.y, vb.x);
  const theta = angB - angA;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  const a = s * cos;
  const b = s * sin;
  const c = -s * sin;
  const d = s * cos;

  const e = overlayTailPx.x - (a * svgTail.x + c * svgTail.y);
  const f = overlayTailPx.y - (b * svgTail.x + d * svgTail.y);

  return { a, b, c, d, e, f };
}

/**
 * Компактніша змія вздовж уже порахованого подобності: масштаб перпендикулярно до хорди голова-хвіст.
 * Центр стискання — середина хорди; кінцеві точки голова/хвіст зберігаються.
 *
 * `chordSquash = 1` — без змін; `0.7` помітно вужче «тіло».
 */
export function withChordSquash(
  affine: Affine2D,
  overlayTailPx: PointSvg,
  overlayHeadPx: PointSvg,
  chordSquash: number,
): Affine2D {
  if (Math.abs(chordSquash - 1) < 1e-5) return affine;

  const vx = overlayHeadPx.x - overlayTailPx.x;
  const vy = overlayHeadPx.y - overlayTailPx.y;
  const lb = Math.hypot(vx, vy) || 1e-9;
  const ux = vx / lb;
  const uy = vy / lb;
  const δ = 1 - chordSquash;

  const ls00 = chordSquash + δ * ux * ux;
  const ls01 = δ * ux * uy;
  const ls10 = δ * uy * ux;
  const ls11 = chordSquash + δ * uy * uy;

  const { a, b, c, d, e, f } = affine;
  const a2 = ls00 * a + ls01 * b;
  const c2 = ls00 * c + ls01 * d;
  const b2 = ls10 * a + ls11 * b;
  const d2 = ls10 * c + ls11 * d;

  const te = ls00 * e + ls01 * f;
  const tf = ls10 * e + ls11 * f;

  const cx = (overlayTailPx.x + overlayHeadPx.x) / 2;
  const cy = (overlayTailPx.y + overlayHeadPx.y) / 2;
  const biasX = cx - ls00 * cx - ls01 * cy;
  const biasY = cy - ls10 * cx - ls11 * cy;

  return { a: a2, b: b2, c: c2, d: d2, e: te + biasX, f: tf + biasY };
}

/**
 * Computes `transform: matrix(a,b,c,d,e,f)` mapping SVG coords → overlay pixel coords,
 * aligning `svgTail` with `overlayTailPx` and `svgHead` with `overlayHeadPx`
 * via uniform scale + rotation + translation (similarity transform).
 */
export function similarityTransformToCssMatrix(params: {
  svgTail: PointSvg;
  svgHead: PointSvg;
  overlayTailPx: PointSvg;
  overlayHeadPx: PointSvg;
}): string {
  return affinityToCssMatrix(similarityAffine(params));
}
