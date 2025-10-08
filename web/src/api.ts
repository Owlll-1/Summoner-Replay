export interface ResolveMatchesResponse {
  regionGuess: string | null;
  puuid: string | null;
  matchIds: string[];
}

export async function resolveMatches(
  riotIdOrMatchId: string
): Promise<ResolveMatchesResponse> {
  const u = new URL("http://localhost:5050/api/matches/resolve");

  // Decide which query param to send
  if (riotIdOrMatchId.includes("_")) {
    u.searchParams.set("matchId", riotIdOrMatchId.trim()); // NA1_123...
  } else {
    u.searchParams.set("riotId", riotIdOrMatchId.trim()); // GameName#Tag
  }

  const r = await fetch(u.toString());

  if (!r.ok) {
    // Try to parse error message from JSON
    type ErrorResponse = { error?: string };
    const err: ErrorResponse = await r.json().catch(() => ({}));
    throw new Error(err.error || r.statusText);
  }

  // Parse JSON response and return
  const data: ResolveMatchesResponse = await r.json();
  return data;
}
export interface ResolveMatchesResponse {
  regionGuess: string | null;
  puuid: string | null;
  matchIds: string[];
}

export interface MatchBundle {
  match: Record<string, unknown>;
  timeline: Record<string, unknown> | null;
  region: string;
}
export async function loadMatch(matchId: string): Promise<MatchBundle> {
  const r = await fetch(`http://localhost:5050/api/match/${matchId}`);
  if (!r.ok) throw new Error("Failed to load match");
  const data: MatchBundle = await r.json();
  return data;
}
