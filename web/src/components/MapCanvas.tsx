import { useEffect, useRef } from "react";
import { Frame, MAP_SIZE, ParticipantLite, neighborFrames, predictPosition } from "../lib/riotTimeline";

type Props = {
  width: number;
  height: number;
  participants: ParticipantLite[];
  frames: Frame[];
  timeMs: number; // current playback time
  showHalos?: boolean;
};

export default function MapCanvas({ width, height, participants, frames, timeMs, showHalos = true }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);

  // Load the background map once
  useEffect(() => {
    const img = new Image();
    img.src = "/maps/sr.png"; // ensure public/maps/sr.png exists
    img.onload = () => {
      bgRef.current = img;
      draw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when time or frames change
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMs, frames, participants, width, height, showHalos]);

  function draw() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // draw background
    if (bgRef.current) {
      ctx.drawImage(bgRef.current, 0, 0, width, height);
    } else {
      // fallback grid
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, width, height);
    }

    // pick anchor frames around timeMs
    const nbr = neighborFrames(frames, timeMs);
    if (!nbr) return;
    const { prev, next } = nbr;

    // participant rings: blue team=100, red team=200
    for (const p of participants) {
      const pPrev = prev.positions[p.participantId];
      const pNext = next.positions[p.participantId];
      const pos = predictPosition(pPrev, pNext, prev.t, next.t, timeMs);

      if (!pos) continue;

      // Map Riot coords to canvas pixels
      const sx = width / MAP_SIZE;
      const sy = height / MAP_SIZE;
      const x = pos.x * sx;
      const y = height - pos.y * sy; // invert Y (Riot origin bottom-left, canvas top-left)

      // Uncertainty halo (how far from last anchor)
      if (showHalos) {
        const sincePrev = Math.max(0, timeMs - prev.t) / 1000; // seconds
        const haloR = clamp(6, 24, 6 + sincePrev * 4);
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = p.teamId === 100 ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)"; // blue/red
        ctx.fill();
      }

      // Champion dot + ring
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = p.teamId === 100 ? "#3B82F6" : "#EF4444";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  return <canvas ref={ref} width={width} height={height} style={{ width, height, borderRadius: 12, boxShadow: "0 2px 18px rgba(0,0,0,0.25)" }} />;
}

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}