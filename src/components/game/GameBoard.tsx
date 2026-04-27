"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOARD_GRID } from "@/lib/board-layout";
import { LeelaboardBackground } from "./LeelaboardBackground";
import { Cell } from "./Cell";

type Props = {
  position: number;
};

const MIN_SCALE = 0.9;
const MAX_SCALE = 2.6;
const SCALE_STEP = 0.08;
const AUTO_FOCUS_COOLDOWN_MS = 900;

type Point = { x: number; y: number };

export function GameBoard({ position }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  /** Лише pan (translate); усередині — окремий шар zoom для кращого рендеру тексту при масштабі. */
  const panLayerRef = useRef<HTMLDivElement | null>(null);
  /** Лише scale; текст усередині — компроміс: CSS scale все одно може злегка згладжувати шрифт, але без `will-change` і з розділенням pan/zoom артефакти менші. */
  const zoomLayerRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<Point | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const dragActiveRef = useRef(false);
  const lastManualPanAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [scaleUi, setScaleUi] = useState(1);
  const [isDraggingUi, setIsDraggingUi] = useState(false);
  const scaleRef = useRef(1);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });

  const applyTransform = useCallback((animate: boolean) => {
    const pan = panLayerRef.current;
    const zoom = zoomLayerRef.current;
    if (!pan || !zoom) return;
    const tr = animate ? "transform 220ms ease-out" : "none";
    pan.style.transition = tr;
    zoom.style.transition = tr;
    pan.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`;
    zoom.style.transform = `scale(${scaleRef.current})`;
    zoom.style.transformOrigin = "center center";
  }, []);

  const clampOffset = useCallback(
    (next: Point, scaleValue: number): Point => {
      const vp = viewportRef.current;
      /** Важливо: міряти саме шар із `scale`, а не `w-full` pan-обгортку — інакше rect ≈ viewport і clamp постійно «центрує», ламаючи drag-pan. */
      const measureEl = zoomLayerRef.current;
      if (!vp || !measureEl) return next;

      let x = next.x;
      let y = next.y;
      scaleRef.current = scaleValue;

      const EPS = 0.75;

      for (let i = 0; i < 14; i++) {
        offsetRef.current = { x, y };
        scaleRef.current = scaleValue;
        applyTransform(false);

        const vpr = vp.getBoundingClientRect();
        const br = measureEl.getBoundingClientRect();

        let dx = 0;
        let dy = 0;

        if (br.width <= vpr.width + EPS) {
          dx = vpr.left + vpr.width / 2 - (br.left + br.width / 2);
        } else {
          if (br.left > vpr.left + EPS) dx = vpr.left - br.left;
          else if (br.right < vpr.right - EPS) dx = vpr.right - br.right;
        }

        if (br.height <= vpr.height + EPS) {
          dy = vpr.top + vpr.height / 2 - (br.top + br.height / 2);
        } else {
          if (br.top > vpr.top + EPS) dy = vpr.top - br.top;
          else if (br.bottom < vpr.bottom - EPS) dy = vpr.bottom - br.bottom;
        }

        if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) break;

        x += dx;
        y += dy;
      }

      offsetRef.current = { x, y };
      scaleRef.current = scaleValue;
      applyTransform(false);
      return { x, y };
    },
    [applyTransform],
  );

  const commitViewport = useCallback(
    (nextScale: number, nextOffset: Point, animate: boolean) => {
      const boundedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      scaleRef.current = boundedScale;
      offsetRef.current = clampOffset(nextOffset, boundedScale);
      setScaleUi(boundedScale);
      applyTransform(animate);
    },
    [applyTransform, clampOffset],
  );

  const applyScaleAtPoint = useCallback(
    (nextScale: number, point: { clientX: number; clientY: number }, animate: boolean) => {
      const boundedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const viewportRect = viewportRef.current?.getBoundingClientRect();
      if (!viewportRect) {
        commitViewport(boundedScale, offsetRef.current, animate);
        return;
      }

      const scaleRatio = boundedScale / scaleRef.current;
      const px = point.clientX - viewportRect.left - viewportRect.width / 2;
      const py = point.clientY - viewportRect.top - viewportRect.height / 2;

      const nextOffset = {
        x: (offsetRef.current.x - px) * scaleRatio + px,
        y: (offsetRef.current.y - py) * scaleRatio + py,
      };

      commitViewport(boundedScale, nextOffset, animate);
    },
    [commitViewport],
  );

  const resetView = useCallback(() => {
    commitViewport(1, { x: 0, y: 0 }, true);
  }, [commitViewport]);

  const focusOnCell = useCallback(
    (cellId: number, animate: boolean) => {
      const viewport = viewportRef.current;
      const zoom = zoomLayerRef.current;
      if (!viewport || !zoom) return;
      const cell = zoom.querySelector<HTMLElement>(`[data-cell-id="${cellId}"]`);
      if (!cell) return;

      offsetRef.current = clampOffset(offsetRef.current, scaleRef.current);
      applyTransform(false);

      const vpr = viewport.getBoundingClientRect();
      const cr = cell.getBoundingClientRect();
      const dx = vpr.left + vpr.width / 2 - (cr.left + cr.width / 2);
      const dy = vpr.top + vpr.height / 2 - (cr.top + cr.height / 2);

      commitViewport(scaleRef.current, {
        x: offsetRef.current.x + dx,
        y: offsetRef.current.y + dy,
      }, animate);
    },
    [applyTransform, clampOffset, commitViewport],
  );

  const schedulePanTransform = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform(false);
    });
  }, [applyTransform]);

  const handleWheelZoom = useCallback(
    (event: WheelEvent) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      if (!viewport.contains(event.target as Node)) return;

      event.preventDefault();
      event.stopPropagation();
      const zoomDelta = Math.max(-0.35, Math.min(0.35, -event.deltaY * 0.0015));
      applyScaleAtPoint(
        scaleRef.current * (1 + zoomDelta),
        {
          clientX: event.clientX,
          clientY: event.clientY,
        },
        false,
      );
    },
    [applyScaleAtPoint],
  );

  useEffect(() => {
    const onResize = () => {
      commitViewport(scaleRef.current, offsetRef.current, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [commitViewport]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheelZoom);
    };
  }, [handleWheelZoom]);

  useEffect(() => {
    if (scaleRef.current <= 1) return;
    const now = Date.now();
    if (now - lastManualPanAtRef.current < AUTO_FOCUS_COOLDOWN_MS) return;
    focusOnCell(position, true);
  }, [focusOnCell, position]);

  useEffect(() => {
    commitViewport(1, { x: 0, y: 0 }, false);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // Лише початковий стан; не прив’язувати до commitViewport — інакше зайві скидання при зміні замикань.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewportClass = useMemo(() => {
    if (scaleUi <= 1) return "cursor-default";
    return isDraggingUi ? "cursor-grabbing" : "cursor-grab";
  }, [isDraggingUi, scaleUi]);

  return (
    <section className="relative flex h-full min-h-0 select-none flex-col rounded-3xl border border-white/40 bg-white/40 p-2 shadow-[0_24px_60px_-30px_rgba(120,90,60,0.35)] backdrop-blur-xl sm:p-5">
      <div className="mb-2 flex items-center justify-between px-1 sm:mb-3 sm:px-0">
        <p className="text-[11px] text-stone-500 sm:text-xs">Жест: pinch/drag для навігації дошкою</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => commitViewport(scaleRef.current + SCALE_STEP, offsetRef.current, true)}
            className="h-7 w-7 rounded-full border border-stone-200 bg-white/80 text-sm font-semibold text-stone-700 transition hover:bg-white"
            aria-label="Збільшити дошку"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => commitViewport(scaleRef.current - SCALE_STEP, offsetRef.current, true)}
            className="h-7 w-7 rounded-full border border-stone-200 bg-white/80 text-sm font-semibold text-stone-700 transition hover:bg-white"
            aria-label="Зменшити дошку"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => focusOnCell(position, true)}
            className="rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-medium text-stone-700 transition hover:bg-white sm:text-xs"
          >
            Find me
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-[10px] font-medium text-stone-700 transition hover:bg-white sm:text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden rounded-2xl select-none ${viewportClass}`}
        style={{ touchAction: scaleUi > 1 ? "none" : "pan-y pinch-zoom" }}
        onPointerDown={(event) => {
          if (scaleRef.current <= 1) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragActiveRef.current = true;
          setIsDraggingUi(true);
          panStartRef.current = {
            x: event.clientX - offsetRef.current.x,
            y: event.clientY - offsetRef.current.y,
          };
        }}
        onPointerMove={(event) => {
          if (!dragActiveRef.current || !panStartRef.current) return;
          event.preventDefault();
          offsetRef.current = clampOffset(
            {
              x: event.clientX - panStartRef.current.x,
              y: event.clientY - panStartRef.current.y,
            },
            scaleRef.current,
          );
          schedulePanTransform();
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          dragActiveRef.current = false;
          setIsDraggingUi(false);
          panStartRef.current = null;
          lastManualPanAtRef.current = Date.now();
          setScaleUi(scaleRef.current);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          dragActiveRef.current = false;
          setIsDraggingUi(false);
          panStartRef.current = null;
          lastManualPanAtRef.current = Date.now();
          setScaleUi(scaleRef.current);
        }}
        onTouchStart={(event) => {
          if (event.touches.length === 2) {
            const [a, b] = [event.touches[0], event.touches[1]];
            const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            pinchStartRef.current = { distance, scale: scaleRef.current };
            return;
          }
          if (event.touches.length === 1 && scaleRef.current > 1) {
            const touch = event.touches[0];
            panStartRef.current = {
              x: touch.clientX - offsetRef.current.x,
              y: touch.clientY - offsetRef.current.y,
            };
          }
        }}
        onTouchMove={(event) => {
          if (event.touches.length === 2 && pinchStartRef.current) {
            const [a, b] = [event.touches[0], event.touches[1]];
            const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const ratio = distance / pinchStartRef.current.distance;
            commitViewport(pinchStartRef.current.scale * ratio, offsetRef.current, false);
            return;
          }
          if (event.touches.length === 1 && panStartRef.current && scaleRef.current > 1) {
            const touch = event.touches[0];
            offsetRef.current = clampOffset(
              {
                x: touch.clientX - panStartRef.current.x,
                y: touch.clientY - panStartRef.current.y,
              },
              scaleRef.current,
            );
            schedulePanTransform();
            lastManualPanAtRef.current = Date.now();
          }
        }}
        onTouchEnd={() => {
          panStartRef.current = null;
          pinchStartRef.current = null;
          setScaleUi(scaleRef.current);
        }}
      >
        <div
          ref={panLayerRef}
          className="mx-auto w-full max-w-[min(100%,calc((100dvh-260px)*1.125))]"
        >
          <div
            ref={zoomLayerRef}
            style={{ transform: "scale(1)", transformOrigin: "center center" }}
          >
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #0a2a3a 0%, #0d3b4f 30%, #1a5c6b 60%, #0e3347 100%)",
              }}
            >
              <LeelaboardBackground />
              <div className="relative z-10 grid grid-cols-9 gap-1">
                {BOARD_GRID.flat().map((cell) => (
                  <Cell key={cell.id} cell={cell} isActive={cell.id === position} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
