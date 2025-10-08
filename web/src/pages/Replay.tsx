import { useEffect, useMemo, useRef, useState } from "react";
import MatchFinder from "../components/MatchFinder";
import { loadMatch, type MatchBundle } from "../api";
import MapCanvas from "../components/MapCanvas";
import {
  extractEvents,
  extractFrames,
  parseParticipants,
  splitTeams,
} from "../lib/riotTimeline";
import TeamRail from "../components/TeamRail";

export default function Replay() {
  const [picked, setPicked] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MatchBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // playback
  const [playing, setPlaying] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const speedRef = useRef<number>(1); // 0.5x, 1x, 2x, etc.

  // Load match when picked
  useEffect(() => {
    if (!picked) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setErr(null); setBundle(null);
        const b = await loadMatch(picked);
        if (!cancelled) {
          setBundle(b);
          setTimeMs(0); // reset time
          setPlaying(false);
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [picked]);

  // Derived data
  const participants = useMemo(() => (bundle ? parseParticipants(bundle.match) : []), [bundle]);
  const teams = useMemo(() => splitTeams(participants), [participants]);
  const frames = useMemo(() => (bundle ? extractFrames(bundle.timeline) : []), [bundle]);
  const events = useMemo(() => (bundle ? extractEvents(bundle.timeline) : []), [bundle]);

  const durationMs = frames.length > 0 ? frames[frames.length - 1].t : 0;

  // Simple RAF loop for playback
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
      return;
    }
    function tick(ts: number) {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = ts - lastTickRef.current; // ms
      lastTickRef.current = ts;

      setTimeMs(prev => {
        const next = Math.min(durationMs, prev + dt * speedRef.current);
        if (next >= durationMs) {
          // stop at end
          setPlaying(false);
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, durationMs]);

  // UI
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <header>
        <h1>Replay</h1>
        <p style={{ opacity: 0.8 }}>
          Enter a Riot ID (e.g., <code>Faker#KR1</code>) or paste a Match ID (e.g., <code>NA1_...</code>).
        </p>
      </header>

      <MatchFinder onPick={setPicked} />

      {picked && (
        <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, display: "grid", gap: 8 }}>
          <div><strong>Selected Match:</strong> {picked}</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setPlaying(p => !p)} disabled={!bundle || frames.length === 0}>
              {playing ? "Pause" : "Play"}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Speed
              <select defaultValue="1" onChange={(e) => (speedRef.current = Number(e.target.value))}>
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            </label>
            <input
              type="range"
              min={0}
              max={durationMs || 0}
              value={timeMs}
              onChange={(e) => setTimeMs(Number(e.target.value))}
              style={{ flex: 1 }}
              disabled={!bundle || frames.length === 0}
            />
            <span style={{ width: 90, textAlign: "right" }}>
              {msToClock(timeMs)} / {msToClock(durationMs)}
            </span>
          </div>
        </section>
      )}

      {loading && <div>Loading match &amp; timeline…</div>}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {bundle && (
  <section style={{ display: "grid", gap: 12 }}>
    {frames.length === 0 ? (
      <div>No timeline available for this match (can’t animate).</div>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 280px",
          gap: 12,
          alignItems: "start",
        }}
      >
        <TeamRail title="Blue Team" team={teams.blue} side="blue" />
        <MapCanvas
          width={900}
          height={900}
          participants={participants}
          frames={frames}
          timeMs={timeMs}
          showHalos
        />
        <TeamRail title="Red Team" team={teams.red} side="red" />
      </div>
    )}

    {/* minimal events preview */}
    <div style={{ fontSize: 14, opacity: 0.85 }}>
      <strong>Events:</strong>{" "}
      {events.slice(0, 12).map((e, i) => (
        <span key={i} style={{ marginRight: 8 }}>
          [{msToClock(e.t)}] {e.kind}
        </span>
      ))}
      {events.length > 12 && <>… (+{events.length - 12} more)</>}
    </div>
  </section>
)}
    </main>
  );
}

function msToClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}
