//define types and constants for Riot API regions
export type Region = "americas" | "europe" | "asia" | "sea";

// Lists of regions for different account/v1 API types
export const ACCOUNT_REGIONS: Region[] = ["americas", "europe", "asia"];
// List of regions for match/v5 API types
export const MATCH_REGIONS:   Region[] = ["americas", "europe", "asia", "sea"];

// Helper to determine region from match ID prefix
export function matchIdToRegion(matchId: string): Region | null {
  if (/^(NA1|BR1|LA1|LA2|LAN|LAS)_/i.test(matchId)) return "americas";
  if (/^(EUW1|EUN1|TR1|RU1)_/i.test(matchId))        return "europe";
  if (/^(KR|JP1)_/i.test(matchId))                    return "asia";
  if (/^(OC1)_/i.test(matchId))                       return "sea";
  return null;
}