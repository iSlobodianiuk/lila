"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOARD_GRID } from "@/lib/board-layout";
import { Cell } from "./Cell";

type Props = {
  position: number;
};

const MIN_SCALE = 0.75;
const MAX_SCALE = 2;
const SCALE_STEP = 0.12;

export function GameBoard({ position }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const clampOffset = useCallback(
    (next: { x: number; y: number }, scaleValue: number) => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const viewportHeight = viewportRef.current?.clientHeight ?? 0;
      const boardWidth = boardRef.current?.clientWidth ?? 0;
      const boardHeight = boardRef.current?.clientHeight ?? 0;

      if (!viewportWidth || !viewportHeight || !boardWidth || !boardHeight) {
        return next;
      }

      const scaledWidth = boardWidth * scaleValue;
      const scaledHeight = boardHeight * scaleValue;

      const maxX = Math.max(0, (scaledWidth - viewportWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - viewportHeight) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [],
  );

  const applyScale = useCallback(
    (nextScale: number) => {
      const boundedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      setScale(boundedScale);
      setOffset((prev) => clampOffset(prev, boundedScale));
    },
    [clampOffset],
  );

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onResize = () => setOffset((prev) => clampOffset(prev, scale));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampOffset, scale]);

  return (
    <section className="relative rounded-3xl border border-white/40 bg-white/40 p-2 shadow-[0_24px_60px_-30px_rgba(120,90,60,0.35)] backdrop-blur-xl sm:p-5">
      <div className="mb-2 flex items-center justify-between px-1 sm:mb-3 sm:px-0">
        <p className="text-[11px] text-stone-500 sm:text-xs">Жест: pinch/drag для навігації дошкою</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyScale(scale + SCALE_STEP)}
            className="h-7 w-7 rounded-full border border-stone-200 bg-white/80 text-sm font-semibold text-stone-700 transition hover:bg-white"
            aria-label="Збільшити дошку"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyScale(scale - SCALE_STEP)}
            className="h-7 w-7 rounded-full border border-stone-200 bg-white/80 text-sm font-semibold text-stone-700 transition hover:bg-white"
            aria-label="Зменшити дошку"
          >
            -
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
        className="relative overflow-hidden rounded-2xl touch-none"
        onWheel={(event) => {
          event.preventDefault();
          const direction = event.deltaY > 0 ? -1 : 1;
          applyScale(scale + direction * SCALE_STEP);
        }}
        onPointerDown={(event) => {
          if (scale <= 1) return;
          setIsDragging(true);
          panStartRef.current = {
            x: event.clientX - offset.x,
            y: event.clientY - offset.y,
          };
        }}
        onPointerMove={(event) => {
          if (!isDragging || !panStartRef.current) return;
          const next = {
            x: event.clientX - panStartRef.current.x,
            y: event.clientY - panStartRef.current.y,
          };
          setOffset(clampOffset(next, scale));
        }}
        onPointerUp={() => {
          setIsDragging(false);
          panStartRef.current = null;
        }}
        onPointerLeave={() => {
          setIsDragging(false);
          panStartRef.current = null;
        }}
        onTouchStart={(event) => {
          if (event.touches.length === 2) {
            const [a, b] = [event.touches[0], event.touches[1]];
            const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            pinchStartRef.current = { distance, scale };
            return;
          }
          if (event.touches.length === 1 && scale > 1) {
            const touch = event.touches[0];
            panStartRef.current = {
              x: touch.clientX - offset.x,
              y: touch.clientY - offset.y,
            };
          }
        }}
        onTouchMove={(event) => {
          if (event.touches.length === 2 && pinchStartRef.current) {
            const [a, b] = [event.touches[0], event.touches[1]];
            const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const ratio = distance / pinchStartRef.current.distance;
            applyScale(pinchStartRef.current.scale * ratio);
            return;
          }
          if (event.touches.length === 1 && panStartRef.current && scale > 1) {
            const touch = event.touches[0];
            const next = {
              x: touch.clientX - panStartRef.current.x,
              y: touch.clientY - panStartRef.current.y,
            };
            setOffset(clampOffset(next, scale));
          }
        }}
        onTouchEnd={() => {
          panStartRef.current = null;
          pinchStartRef.current = null;
        }}
      >
        <div
          ref={boardRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
          className="transition-transform duration-150"
        >
          <div className="grid grid-cols-9 gap-1 sm:gap-2">
            {BOARD_GRID.flat().map((cell) => (
              <Cell key={cell.id} cell={cell} isActive={cell.id === position} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
