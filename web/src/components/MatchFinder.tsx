import { useState } from "react";
import { resolveMatches } from "../api";

export default function MatchFinder({ onPick }: { onPick: (matchId: string) => void }) {
  // User input
  const [input, setInput] = useState("");
  // Loading state
  const [loading, setLoading] = useState(false);
  // Match IDs
  const [ids, setIds] = useState<string[]>([]);
  // Any error message
  const [err, setErr] = useState<string | null>(null);

    // Clear errors and previous IDs then calls resolveMatches API
    // Success: store match IDs
    // Failure: store error message
    async function onResolve() {
    setErr(null);
    setIds([]);
    if (!input.trim()) return;

    try {
      setLoading(true);
      const { matchIds } = await resolveMatches(input.trim());
      setIds(matchIds);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr(String(e));
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    // Simple card-like UI
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 8px" }}>Find your matches</h2>
      <p style={{ margin: "0 0 12px" }}>
        Enter your Riot ID (e.g., <code>GameName#Tag</code>) or paste a Match ID (e.g., <code>NA1_123...</code>).
      </p>
    
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="GameName#Tag  or  NA1_1234567890"
        /> 
        <button onClick={onResolve} disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "Searching..." : "Find"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {ids.length > 0 && (
        <ul style={{ marginTop: 12 }}>
          {ids.map((id) => (
            <li key={id} style={{ marginBottom: 6 }}>
              {id}{" "}
              <button onClick={() => onPick(id)} style={{ marginLeft: 8 }}>
                Play replay
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
