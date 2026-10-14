import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** True while the reader asks the OS for less motion; follows the setting live. */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION).matches);
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION);
    if (!query) return undefined;
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
};

/**
 * Window-level keys for a focused review session. `onKey(key, event)` gets the lowercased
 * key; it is skipped while typing in a field or with a modifier held. The latest `onKey`
 * is always used, so the listener is attached once.
 */
export const useReviewKeys = (enabled, onKey) => {
  const latest = useRef(onKey);
  useEffect(() => {
    latest.current = onKey;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event) => {
      if (event.target.closest?.("input, textarea, select, [contenteditable=true]") || event.metaKey || event.ctrlKey || event.altKey) return;
      latest.current?.(event.key.toLowerCase(), event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
};

/** How far (px, or a share of the card width) a swipe must travel to count. */
const SWIPE_PX = 96;
const SWIPE_SHARE = 0.3;
/** Drag distance before a touch counts as a horizontal swipe rather than a tap or scroll. */
const SLOP_PX = 8;

/**
 * Swipe a card left or right with a finger or pen (mouse drags stay text selection).
 * Returns `bind` (spread on the card), `dx` (the current offset, px), `progress`
 * (-1..1, the share of the way to a grade) and `dragging`. On release past the
 * threshold `onSwipe("left" | "right")` fires; otherwise the card springs back.
 * The card should set `touch-action: pan-y` so vertical scrolling still works.
 */
export const useSwipe = ({ enabled, onSwipe }) => {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(1);
  const start = useRef(null);

  const threshold = Math.min(SWIPE_PX, width * SWIPE_SHARE);
  const reset = () => {
    start.current = null;
    setDragging(false);
    setDx(0);
  };

  const bind = enabled
    ? {
        onPointerDown: (event) => {
          if (event.pointerType === "mouse" || event.button !== 0) return;
          start.current = { x: event.clientX, y: event.clientY, id: event.pointerId, swiping: false };
          setWidth(event.currentTarget.offsetWidth || 1);
        },
        onPointerMove: (event) => {
          const s = start.current;
          if (!s || s.id !== event.pointerId) return;
          const moveX = event.clientX - s.x;
          if (!s.swiping) {
            const moveY = event.clientY - s.y;
            if (Math.abs(moveY) > SLOP_PX && Math.abs(moveY) > Math.abs(moveX)) return reset();
            if (Math.abs(moveX) < SLOP_PX) return;
            s.swiping = true;
            setDragging(true);
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The pointer is already gone; the release still arrives or cancels.
            }
          }
          setDx(moveX);
        },
        onPointerUp: (event) => {
          const s = start.current;
          if (!s || s.id !== event.pointerId) return;
          const moveX = event.clientX - s.x;
          const passed = s.swiping && Math.abs(moveX) >= threshold;
          reset();
          if (passed) onSwipe(moveX > 0 ? "right" : "left");
        },
        onPointerCancel: reset,
      }
    : {};

  // A gesture cut short by `enabled` turning off leaves no offset behind.
  const offset = enabled ? dx : 0;
  const progress = Math.max(-1, Math.min(1, offset / threshold));
  return { bind, dx: offset, progress, dragging: enabled && dragging };
};
