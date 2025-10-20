// web/src/pages/Replay.tsx
// Replay page with:
// - Match search/pick
// - Match+timeline load
// - Frames/events parsing
// - Live state (deaths, objective up-ness)
// - Dynamic tower learning from BUILDING_KILL events (localStorage)
// - Map with overlays + event bar + HUD

import { useEffect, useMemo, useRef, useState } from "react";

// UI components
import MatchFinder from "../components/MatchFinder";
import TeamRail from "../components/TeamRail";
import MapCanvas from "../components/MapCanvas";
import MapOverlay from "../components/MapOverlay";
import EventBar from "../components/EventBar";
import ObjectiveHUD from "../components/ObjectiveHUD";
import EventBanner from "../components/EventBanner";

// API
import { loadMatch, type MatchBundle } from "../api";

// Timeline utils
import {
  extractEvents,
  extractFrames,
  parseParticipants,
  splitTeams,
} from "../lib/riotTimeline";

// Live game state (who’s dead, objectives up)
import { computeLiveState } from "../lib/gameState";

// Dynamic tower model (learn from events, persist, query alive at time)
import {
  learnFromEvents,
  loadModel,
  saveModel,
  getAliveSitesAt,
  type TowerModel,
} from "../lib/towerModel";

export default function Replay() {
  // UI / network
  const [picked, setPicked] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MatchBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // playback
  const [playing, setPlaying] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const speedRef = useRef<number>(1);

  // tower model (persisted)
  const [towerModel, setTowerModel] = useState<TowerModel>(() => loadModel());

  // Load match when a new one is picked
  useEffect(() => {
    if (!picked) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setBundle(null);
        const b = await loadMatch(picked);
        if (!cancelled) {
          setBundle(b);
          setTimeMs(0);
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

  // Derive data for rendering
  const participants = useMemo(
    () => (bundle ? parseParticipants(bundle.match) : []),
    [bundle]
  );
  const frames = useMemo(
    () => (bundle ? extractFrames(bundle.timeline) : []),
    [bundle]
  );
  const events = useMemo(
    () => (bundle ? extractEvents(bundle.timeline) : []),
    [bundle]
  );
  const teams = useMemo(() => splitTeams(participants), [participants]);
  const durationMs = frames.length > 0 ? frames[frames.length - 1].t : 0;

  // Live state at current time (dead set, objectives up)
  const live = useMemo(() => computeLiveState(events, timeMs), [events, timeMs]);

  // Learn tower positions from events whenever events change
  useEffect(() => {
    if (events.length === 0) return;
    const updated = learnFromEvents(towerModel, events);

    // Shallow equality check to avoid save loops
    const keysA = Object.keys(towerModel);
    const keysB = Object.keys(updated);
    let changed = keysA.length !== keysB.length;
    if (!changed) {
      for (const k of keysB) {
        const a = towerModel[k]; const b = updated[k];
        if (!a || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5 || a.count !== b.count) {
          changed = true; break;
        }
      }
    }
    if (changed) {
      setTowerModel(updated);
      saveModel(updated);
    }
  }, [events, towerModel]);

  // Alive towers (sites we’ve learned that haven’t been killed yet by timeMs)
  const aliveTowers = useMemo(() => {
    return getAliveSitesAt(towerModel, events, timeMs).map(s => ({
      x: s.x, y: s.y, teamId: s.teamId,
    }));
  }, [towerModel, events, timeMs]);

  // RAF loop for playback
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
      return;
    }
    function tick(ts: number) {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = ts - lastTickRef.current;
      lastTickRef.current = ts;
      setTimeMs((prev) => {
        const next = Math.min(durationMs, prev + dt * speedRef.current);
        if (next >= durationMs) setPlaying(false);
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, durationMs]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); setTimeMs((t) => Math.max(0, t - 3000)); }
      else if (e.code === "ArrowRight") { e.preventDefault(); setTimeMs((t) => Math.min(durationMs, t + 3000)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [durationMs]);

  // Seek handler for EventBar
  function handleSeek(t: number) {
    setPlaying(false);
    setTimeMs(Math.max(0, Math.min(t, durationMs)));
  }

  // render
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <header>
        <h1>Replay</h1>
        <p style={{ opacity: 0.8 }}>
          Enter a Riot ID (e.g., <code>Faker#KR1</code>) or paste a Match ID (e.g., <code>NA1_…</code>).
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
                gridTemplateColumns: "280px auto 280px",
                gap: 12,
                alignItems: "center",
                justifyItems: "center",
              }}
            >
              <TeamRail title="Blue Team" team={teams.blue} side="blue" />

              <div style={{
                 position: "relative", 
                 width: 900, 
                 height: 900,
                 justifySelf: "center",
                 }}>
                <MapCanvas
                  width={900}
                  height={900}
                  participants={participants}
                  frames={frames}
                  timeMs={timeMs}
                  showHalos
                  markerStyle="name"
                  dead={live.dead}
                  aliveTowers={aliveTowers}
                />
                <MapOverlay width={900} height={900} events={events} timeMs={timeMs} />
                <ObjectiveHUD
                  dragon={live.objectivesUp.dragon}
                  baron={live.objectivesUp.baron}
                  herald={live.objectivesUp.herald}
                />
                <EventBanner 
                  events={events} 
                  timeMs={timeMs}
                  width={900}
                />
              </div>

              <TeamRail title="Red Team" team={teams.red} side="red" />
            </div>
          )}

          <EventBar events={events} onSeek={handleSeek} />
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
