// Loads environment variables from .env file
import "dotenv/config";
// Express is our web server framework
import express from "express";
// Cross-Origin Resource Sharing allows our web app to call the backend
import cors from "cors";
// Brings in our Riot API helper(s)
import { riot } from "./riot.js";
// Brings in region arrays and matchId helper
import { ACCOUNT_REGIONS, MATCH_REGIONS, matchIdToRegion, type Region } from "./regions.js";

// Creates an app object we can add routes to
const app = express();
// Allows different port access
app.use(cors());
// Automatically parse JSON in request bodies
app.use(express.json());

// Health Check
// Get request = run this function
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// Resolver: Riot ID or Match ID -> recent match IDs
app.get("/api/matches/resolve", async (req, res) => {
  try {
    // Read & validate query parameters
    const riotId = typeof req.query.riotId === "string" ? req.query.riotId : "";
    const matchId = typeof req.query.matchId === "string" ? req.query.matchId : "";
    const start = Number(req.query.start || 0);
    const count = Number(req.query.count || 10);

    // If matchId, guess region and return matchId in JSON
    if (matchId) {
      return res.json({ regionGuess: matchIdToRegion(matchId), puuid: null, matchIds: [matchId] });
    }

    // Check Riot ID format
    if (!riotId.includes("#")) {
      return res.status(400).json({ error: "Provide riotId like GameName#Tag or a matchId." });
    }
    // Split Riot ID into name & tag
    const [gameName, tagLine] = riotId.split("#");

    // Try all 3 account regions to find the PUUID
    // Then try all 4 match regions to find recent matches
    // A) Riot ID -> PUUID (probe account regions)
    const accountTries = await Promise.allSettled(
      ACCOUNT_REGIONS.map(async (rg) => ({
        rg,
        data: await riot(rg, `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
      }))
    );
    // Find the first successful one with a PUUID
    const hit = accountTries.find(
      (t: any) => t.status === "fulfilled" && t.value?.data?.puuid
    ) as PromiseFulfilledResult<{ rg: Region; data: { puuid: string } }> | undefined;
    if (!hit) return res.status(404).json({ error: "Account not found. Check spelling & tag." });

    // Store the found PUUID
    const puuid = hit.value.data.puuid;

    // B) PUUID -> match IDs (probe match regions)
    const matchTries = await Promise.allSettled(
      MATCH_REGIONS.map(async (rg) => ({
        rg,
        ids: await riot(rg, `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`)
      }))
    );
    // Find the first successful one with some match IDs
    const found = matchTries.find(
      (t: any) => t.status === "fulfilled" && Array.isArray(t.value.ids) && t.value.ids.length > 0
    ) as PromiseFulfilledResult<{ rg: Region; ids: string[] }> | undefined;

    // Return the found region, PUUID, and match IDs (or empty array)
    const regionGuess = found?.value?.rg ?? null;
    const matchIds = found?.value?.ids ?? [];

    res.json({ regionGuess, puuid, matchIds });
    // Return error message if didn't work
  } catch (e: any) {
    res.status(500).json({ error: "Lookup failed", detail: String(e.message || e) });
  }
  // GET /api/match/:matchId -> returns match, timeline (if available), and region
  app.get("/api/match/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const region =
      matchIdToRegion(matchId) ?? "americas"; // fallback if unknown

    const match = await riot(region, `/lol/match/v5/matches/${matchId}`);
    let timeline: any = null;
    try {
      timeline = await riot(region, `/lol/match/v5/matches/${matchId}/timeline`);
    } catch {
      timeline = null; // some matches don’t have timelines
    }
    res.json({ match, timeline, region });
  } catch (e: any) {
    res.status(500).json({ error: "Match fetch failed", detail: String(e.message || e) });
  }
});
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
