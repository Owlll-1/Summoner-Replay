import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Welcome to LoL Match Replay</h1>
      <p>
        Watch Summoner’s Rift replays on a 2D map. Search by Riot ID or Match ID,
        then play the timeline with smooth dead-reckoning movement. Disclaimer, this replay may not be entirely accurate.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/replay">
          <button>Open Replay</button>
        </Link>
        <Link to="/login">
          <button>Log in</button>
        </Link>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>What you can do</h2>
        <ul>
          <li>Find your recent matches by Riot ID</li>
          <li>Replay positions and major events on a 2D map</li>
          <li>See team stats and objective animations</li>
        </ul>
      </section>
    </main>
  );
}
