import { useEffect, useState } from "react";
import type { ViewportLayoutMode } from "../types/game";

export interface ViewportMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  layoutMode: ViewportLayoutMode;
  boardSizePx: number;
  isCompactHeight: boolean;
}

function calculateMetrics(): ViewportMetrics {
  const width =
    typeof window !== "undefined"
      ? window.visualViewport?.width ?? window.innerWidth
      : 1200;
  const height =
    typeof window !== "undefined"
      ? window.visualViewport?.height ?? window.innerHeight
      : 800;

  const aspectRatio = width / Math.max(height, 1);
  const isCompactHeight = height < 560;

  let layoutMode: ViewportLayoutMode = "portrait";
  let boardSizePx = 320;

  if (aspectRatio >= 1.22 && width >= 1040 && height >= 560) {
    // Wide screens: board on the left, slim match column on the right
    layoutMode = "command";
    const maxByWidth = width - 520; // match column + gaps + page padding
    const maxByHeight = height - 190; // header + page padding + footer
    boardSizePx = Math.round(Math.max(260, Math.min(maxByWidth, maxByHeight, 580)));
  } else if (aspectRatio >= 1.06 && width >= 540) {
    // Landscape phones / tablets / medium windows: same side-by-side arrangement, tighter
    layoutMode = "split";
    const maxByWidth = width - 380;
    const maxByHeight = height - (isCompactHeight ? 120 : 180);
    boardSizePx = Math.round(Math.max(170, Math.min(maxByWidth, maxByHeight, 520)));
  } else {
    // Portrait: scoreboard above, game actions below the board
    layoutMode = "portrait";
    const maxByWidth = width - 28;
    const maxByHeight = height - 400;
    boardSizePx = Math.round(Math.max(220, Math.min(maxByWidth, maxByHeight, 520)));
  }

  return {
    width,
    height,
    aspectRatio,
    layoutMode,
    boardSizePx,
    isCompactHeight,
  };
}

export function useViewportLayout(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() =>
    calculateMetrics()
  );

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMetrics(calculateMetrics());
      });
    };

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    window.visualViewport?.addEventListener("resize", update, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return metrics;
}
