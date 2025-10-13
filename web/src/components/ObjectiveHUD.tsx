// web/src/components/ObjectiveHUD.tsx
// Simple "what's up" panel for Dragon / Baron / Herald.
// Reads booleans from computeLiveState().objectivesUp and shows an icon per objective.
// Green = up, gray = down (just died or not spawned yet).

type Props = {
  dragon: boolean;
  baron: boolean;
  herald: boolean;
};

export default function ObjectiveHUD({ dragon, baron, herald }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        display: "grid",
        gap: 6,
        padding: 8,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        pointerEvents: "none",
      }}
    >
      <Row ok={dragon} label="Dragon" />
      <Row ok={baron} label="Baron" />
      <Row ok={herald} label="Herald" />
    </div>
  );
}

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: ok ? "#22c55e" : "#9ca3af", // green if up, gray if down
          boxShadow: ok ? "0 0 6px rgba(34,197,94,0.8)" : "none",
        }}
      />
      <span style={{ fontSize: 12, color: "#111827" }}>{label}</span>
    </div>
  );
}
