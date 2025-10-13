import type { ParticipantLite } from "../lib/riotTimeline";

type Props = {
  title: string;              // "Blue Team" or "Red Team"
  team: ParticipantLite[];    // participants for that team
  side: "blue" | "red";       // styles
};

export default function TeamRail({ title, team, side }: Props) {
  const ring = side === "blue" ? "#1868e9ff" : "#ca1212ff"; // Tailwind blue-500/red-500
  const accentBg = side === "blue" ? "rgba(29, 111, 243, 1)" : "rgba(238, 30, 30, 1)";

  return (
    <aside
      style={{
        display: "grid",
        gap: 8,
        padding: 12,
        border: "1px solid #00040aff",
        borderRadius: 12,
        background: "#fdfdfdff",
        minWidth: 260,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 8px", background: accentBg, borderRadius: 8 }}>
        {title}
      </div>

      <ul style={{ display: "grid", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
        {team.map((p) => (
          <li
            key={p.participantId}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr auto",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              border: "1px solid #000714ff",
              borderRadius: 10,
            }}
          >
            {/* Portrait placeholder: a ring with champion initials */}
            <div
              title={p.championName}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `3px solid ${ring}`,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#111827",
                background: "#fff",
              }}
            >
              {initials(p.championName)}
            </div>

            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {p.summonerName}
              </div>
              <div style={{ fontSize: 12, color: "#111827", opacity: 0.8 }}>{p.championName}</div>
            </div>

            <div style={{ textAlign: "right", color: "#111827", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              <span title="K/D/A">{p.kills}/{p.deaths}/{p.assists}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
