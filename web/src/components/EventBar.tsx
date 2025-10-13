// This component shows a horizontal list of icons (kills, towers, epic monsters).
// Each icon represents a game event at a specific time in the timeline.
// Clicking an icon will "seek" the replay to that event’s time.

import { useMemo, useState } from "react";
import type { ReplayEvent } from "../lib/riotTimeline"; // import our normalized event type

// The parent (Replay page) will pass these props:
type Props = {
  events: ReplayEvent[];          // all parsed events from the timeline
  onSeek: (tMs: number) => void;  // function to jump to a given time when user clicks
};

// We'll allow filtering between event types
type Filter = "ALL" | "KILL" | "TOWER" | "EPIC";

export default function EventBar({ events, onSeek }: Props) {
  // Track which filter button is currently active
  const [filter, setFilter] = useState<Filter>("ALL");

  // Compute the list of events that should be shown based on the filter
  // useMemo avoids recomputing unless `events` or `filter` changes
  const filtered = useMemo(() => {
    switch (filter) {
      case "KILL":
        return events.filter((e) => e.kind === "CHAMP_KILL");
      case "TOWER":
        return events.filter((e) => e.kind === "BUILDING_KILL");
      case "EPIC":
        return events.filter((e) => e.kind === "ELITE_MONSTER_KILL");
      default:
        return events;
    }
  }, [events, filter]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Filter buttons row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Events</span>
        {/* Each FilterButton is a small toggle */}
        <FilterButton label="All" active={filter === "ALL"} onClick={() => setFilter("ALL")} />
        <FilterButton label="Kills" active={filter === "KILL"} onClick={() => setFilter("KILL")} />
        <FilterButton label="Towers" active={filter === "TOWER"} onClick={() => setFilter("TOWER")} />
        <FilterButton label="Epics" active={filter === "EPIC"} onClick={() => setFilter("EPIC")} />
      </div>

      {/* Scrollable horizontal row of event icons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",     // allows horizontal scrolling if too many icons
          padding: 8,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        {/* If no events match the filter, show a placeholder message */}
        {filtered.length === 0 ? (
          <span style={{ opacity: 0.7, fontSize: 14 }}>No events for this filter.</span>
        ) : (
          // Map each event to a clickable button (EventPill)
          filtered.map((e, idx) => (
            <EventPill key={idx} e={e} onSeek={onSeek} />
          ))
        )}
      </div>
    </div>
  );
}

/* Small helper components */

// A reusable filter button
function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#111827",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// The small rounded “pill” representing one event icon
function EventPill({ e, onSeek }: { e: ReplayEvent; onSeek: (tMs: number) => void }) {
  const icon = iconFor(e);  // choose SVG icon based on event kind
  const label = labelFor(e); // readable tooltip text (optional helper)

  return (
    <button
      onClick={() => onSeek(e.t)} // Jump to this event’s timestamp
      title={label} // native tooltip
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {/* show time in mm:ss format */}
      <span style={{ fontFamily: "monospace", fontSize: 12 }}>
        {msToClock(e.t)}
      </span>
    </button>
  );
}

// Return a simple inline SVG icon depending on event kind
function iconFor(e: ReplayEvent) {
  const size = 14;
  switch (e.kind) {
    case "CHAMP_KILL":
      // skull icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 3c-4.4 0-8 3.134-8 7 0 2.28 1.19 4.292 3 5.5V19a2 2 0 0 0 2 2h1v-3h2v3h1a2 2 0 0 0 2-2v-3.5c1.81-1.208 3-3.22 3-5.5 0-3.866-3.6-7-8-7Zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
            fill="#111827"
          />
        </svg>
      );
    case "BUILDING_KILL":
      // tower
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path d="M8 22h8l-1-9h2l1-7-4-2-4 2 1 7h2l-1 9Z" fill="#111827" />
        </svg>
      );
    case "ELITE_MONSTER_KILL":
      // dragon-like swirl
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 2c5.523 0 10 4.477 10 10 0 4.418-3.582 8-8 8-3.866 0-7-3.134-7-7 0-2.761 2.239-5 5-5 2.209 0 4 1.791 4 4 0 1.657-1.343 3-3 3-1.105 0-2-.895-2-2 0-.552.448-1 1-1s1 .448 1 1a1 1 0 1 0 2 0 3 3 0 0 0-3-3 5 5 0 1 0 0 10c4.418 0 8-3.582 8-8 0-4.971-4.029-9-9-9Z"
            fill="#111827"
          />
        </svg>
      );
    default:
      // fallback circle
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4" fill="#111827" />
        </svg>
      );
  }
}

// Convert milliseconds to readable mm:ss
function msToClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

// Optional helper for tooltip labels
function labelFor(e: ReplayEvent): string {
  switch (e.kind) {
    case "CHAMP_KILL": return "Champion kill";
    case "BUILDING_KILL": return "Tower destroyed";
    case "ELITE_MONSTER_KILL": return "Epic monster slain";
    default: return "Event";
  }
}