import { useState } from "react";
import MatchFinder from "./components/MatchFinder";

export default function App() {
  // Keep track of the picked match ID
  const [picked, setPicked] = useState<string | null>(null);

  // Simple layout with title, match finder, and picked match display
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, display: "grid", gap: 16 }}>
      <h1>LoL Replay MVP</h1>
      
      <MatchFinder onPick={(id) => setPicked(id)} />

      {picked && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <strong>Selected Match:</strong> {picked}
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
            (Next we’ll load match + timeline and render the map.)
          </div>
        </div>
      )}
    </div>
  );
}

