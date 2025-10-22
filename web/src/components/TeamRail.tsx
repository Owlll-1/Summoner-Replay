import type { ParticipantLite, ReplayEvent } from "../lib/riotTimeline";

type Props = {
  title: string;              // "Blue Team" or "Red Team"
  team: ParticipantLite[];    // participants for that team
  side: "blue" | "red";       // styles
  events: ReplayEvent[];      // all game events from timeline
  timeMs: number;             // current playback position
};

export default function TeamRail({ title, team, side, events, timeMs }: Props) {
  const ring = side === "blue" ? "#1868e9ff" : "#ca1212ff"; // Tailwind blue-500/red-500
  const accentBg = side === "blue" ? "rgba(29, 111, 243, 1)" : "rgba(238, 30, 30, 1)";


  function getRecentActivity(participantId: number): "kill" | "death" | null {
    const recentWindowMs = 5000; // last 5 seconds
    const minTime = timeMs - recentWindowMs;

    const recentEvents = events.filter(e =>
      e.t > minTime && e.t <= timeMs && e.kind === "CHAMP_KILL"
    );
    
    const gotKill = recentEvents.some(e => e.killerId === participantId);
    if (gotKill) return "kill"; 

    const died = recentEvents.some(e => e.victimId === participantId);
    if (died) return "death";


    return null;
  }

  return (
    <aside
      style={{
        display: "grid",
        gap: 8,
        padding: 15,
        border: "1px solid #000000ff",
        borderRadius: 12,
        background: "#2e2d2dff",
        minWidth: 260,
      }}
    >
    <div 
      style={{ 
        fontFamily: "Friz Quadrata, serif",
        fontWeight: 700, 
        fontSize: 16, 
        padding: "6px 8px", 
        background: accentBg, 
        borderRadius: 8 
        }}
    >
        {title}
    </div>

    <ul 
      style={{ 
        display: "grid",
        gap: 8, margin: 0,
        padding: 0,
        listStyle: "none" 
        }}
    >

        {team.map((p) => {
          const activity = getRecentActivity(p.participantId);

          return (
          <li
            key={p.participantId}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr auto",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              border: "1px solid #000000ff",
              borderRadius: 10,
              position: "relative",
              backgroundColor: "#474747ff",
              color: "#e5e8ecff",
            }}
          >
            { /*Portrait placeholder: a ring with champion initials */}
            <div
              title={p.championName}
              style={{
                fontFamily: "Friz Quadrata, serif",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `3px solid ${ring}`,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "#d9dce4ff",
                background: "#272525ff",
              }}
            >
              {initials(p.championName)}
            </div>

            <div 
            style={{ 
              overflow: "hidden" 
              }}
            >
              <div 
              style={{ 
                fontSize: 14,
                fontWeight: 600, 
                whiteSpace: "nowrap", 
                textOverflow: "ellipsis", 
                overflow: "hidden" 
                }}>

                {p.summonerName}
              </div>
              <div 
              style={{ 
                fontFamily: "Friz Quadrata, serif",
                fontSize: 18,
                fontWeight: 525, 
                color: "#ffffffff", 
                opacity: 0.8 
                }}>
                  {p.championName}
                  </div>
            </div>

            <div 
            style={{ 
              textAlign: "right", 
              color: "#e5e8ecff", 
              fontFamily: "Friz Quadrata, serif" 
              }}>
              <span title="K/D/A">{p.kills}/{p.deaths}/{p.assists}</span>
            </div>
            {activity && <ActivityBadge type={activity} />} 
          </li>
          );
        })}
      </ul>
    </aside>
  );
}

function ActivityBadge({ type }: { type: "kill" | "death" }) {
  const isKill = type === "kill";

  return (
    <div
    style ={{
      fontFamily: "Friz Quadrata, serif",
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      padding: "2px 6px",
      borderRadius: 6,
      background: isKill ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)", 
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 1,
      boxShadow: isKill ? "0 0 8px rgba(16, 185, 129, 0.7)" : "0 0 8px rgba(239, 68, 68, 0.7)",
      pointerEvents: "none",
      animation: "fadeIn 0.3s ease-out",
    }}
  >
    {isKill ? "Kill!" : "Death"}    
  </div>
  );
}

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
