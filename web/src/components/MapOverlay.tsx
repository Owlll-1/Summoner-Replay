// MapOverlay.tsx
// Renders small animated effects (SVG/CSS) above the map when events occur.
// It watches the current playback time and, whenever the time passes an event,
// it spawns a short-lived "effect" at that event's map position.
//
// Notes:
// - We position effects with absolute CSS (top/left) inside a relative container.
// - Riot coordinates are 0..MAP_SIZE. We scale to pixels and invert Y.
// - Effects self-remove after a short duration so the list doesn't grow forever.

import { useEffect, useRef, useState, useCallback } from "react";
import type { ReplayEvent } from "../lib/riotTimeline";
import { MAP_SIZE } from "../lib/riotTimeline";

type Props = {
  width: number;               // same width as the map canvas
  height: number;              // same height as the map canvas
  timeMs: number;              // current playback time
  events: ReplayEvent[];       // normalized events from the timeline
};

type Effect = {
  id: number;                  // unique id for React keys
  kind: ReplayEvent["kind"];   // CHAMP_KILL / BUILDING_KILL / ELITE_MONSTER_KILL
  x: number;                   // canvas-space x in pixels
  y: number;                   // canvas-space y in pixels (already inverted for CSS)
  bornAt: number;              // when spawned (performance.now())
  lifeMs: number;              // how long to show the effect
};

export default function MapOverlay({ width, height, timeMs, events }: Props) {
  // Active effects we’re drawing right now (short-lived)
  const [effects, setEffects] = useState<Effect[]>([]);
  // Keep a running counter for stable keys
  const nextIdRef = useRef(1);
  // Track the previous timeline time so we know if we just crossed new events
  const prevTimeRef = useRef<number>(timeMs);

  // Precompute scale factors so we can convert Riot coords -> pixels
  const sx = width / MAP_SIZE;
  const sy = height / MAP_SIZE;

  // Spawn helper: create an Effect at a Riot position (x,y) and add to list
  const spawn = useCallback((kind: Effect["kind"], rx?: number, ry?: number) => {
    if (typeof rx !== "number" || typeof ry !== "number") return; // no position → skip
    const x = rx * sx;
    const y = height - ry * sy; // invert Y for CSS top/left coords

    const id = nextIdRef.current++;
    const life = kind === "CHAMP_KILL" ? 1100
               : kind === "ELITE_MONSTER_KILL" ? 1300
               : 1000; // BUILDING_KILL

    setEffects((prev) => [...prev, { id, kind, x, y, bornAt: performance.now(), lifeMs: life }]);
  }, [sx, sy, height]);

  // Whenever playback time changes, check if we crossed any events.
  useEffect(() => {
    const prev = prevTimeRef.current;
    const now = timeMs;
    prevTimeRef.current = now;

    // Only emit effects when time moves forward (ignore reverse scrubs)
    if (now <= prev) return;

    // Find events with time in (prev, now]
    const newlyCrossed = events.filter((e) => e.t > prev && e.t <= now);
    if (newlyCrossed.length === 0) return;

    // Spawn effects for each new event
    for (const e of newlyCrossed) {
      spawn(e.kind, e.x, e.y);
    }
  }, [timeMs, events, sx, sy, height]);

  // Auto-clean effects after their lifeMs
  useEffect(() => {
    if (effects.length === 0) return;
    const timer = setInterval(() => {
      const now = performance.now();
      setEffects((prev) => prev.filter((ef) => now - ef.bornAt < ef.lifeMs));
    }, 100);
    return () => clearInterval(timer);
  }, [effects.length]);

  return (
    // This container must be absolutely positioned over the canvas' parent (which should be relative)
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // let clicks pass through to the canvas/controls
      }}
    >
      {effects.map((ef) => (
        <EffectSprite key={ef.id} effect={ef} />
      ))}
    </div>
  );
}

/* ----------------- Small animated sprites ----------------- */

function EffectSprite({ effect }: { effect: Effect }) {
  // Progress 0..1 based on lifetime for inline CSS animation calculations
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = () => {
      const t = performance.now();
      const p = Math.min(1, (t - start) / effect.lifeMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [effect.lifeMs]);

  // Choose which visual to draw
  switch (effect.kind) {
    case "CHAMP_KILL":
      return <KillPulse x={effect.x} y={effect.y} p={progress} />;

    case "ELITE_MONSTER_KILL":
      return <EpicRipple x={effect.x} y={effect.y} p={progress} />;

    case "BUILDING_KILL":
      return <TowerFlash x={effect.x} y={effect.y} p={progress} />;

    default:
      return null;
  }
}

/* Kill: skull that scales up + a pulse ring */
function KillPulse({ x, y, p }: { x: number; y: number; p: number }) {
  const scale = 0.6 + 0.8 * p; // grow
  const opacity = 1 - p;       // fade out

  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}>
      {/* pulse ring */}
      <div
        style={{
          position: "absolute",
          width: 60 * p,
          height: 60 * p,
          borderRadius: "50%",
          border: "2px solid rgba(0,0,0,0.25)",
          transform: "translate(-50%, -50%)",
          left: 0, top: 0,
        }}
      />
      {/* skull icon (inline SVG) */}
      <div
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          width: 18,
          height: 18,
        }}
      >
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path
            d="M12 3c-4.4 0-8 3.134-8 7 0 2.28 1.19 4.292 3 5.5V19a2 2 0 0 0 2 2h1v-3h2v3h1a2 2 0 0 0 2-2v-3.5c1.81-1.208 3-3.22 3-5.5 0-3.866-3.6-7-8-7Zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
            fill="#111827"
          />
        </svg>
      </div>
    </div>
  );
}

/* Epic monster: expanding ripples (like a water ring) */
function EpicRipple({ x, y, p }: { x: number; y: number; p: number }) {
  const r1 = 20 + 50 * p;
  const r2 = 10 + 35 * p;
  const o = 1 - p;

  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <div
        style={{
          position: "absolute",
          width: r1, height: r1, borderRadius: "50%",
          border: "2px solid rgba(34,197,94,0.5)", // greenish
          transform: "translate(-50%, -50%)",
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: r2, height: r2, borderRadius: "50%",
          border: "2px solid rgba(34,197,94,0.35)",
          transform: "translate(-50%, -50%)",
          opacity: o,
        }}
      />
    </div>
  );
}

/* Tower destroyed: quick flash "tower" that scales up then fades */
function TowerFlash({ x, y, p }: { x: number; y: number; p: number }) {
  const scale = 0.7 + 0.6 * p;
  const opacity = 1 - p;

  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          width: 18,
          height: 18,
        }}
      >
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path d="M8 22h8l-1-9h2l1-7-4-2-4 2 1 7h2l-1 9Z" fill="#111827" />
        </svg>
      </div>
    </div>
  );
}
