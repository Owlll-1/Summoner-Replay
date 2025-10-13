// Learns tower/structure positions from BUILDING_KILL events
// and persists an incremental average per (teamId, lane, kind) in localStorage.
// - kind is derived from Riot towerType/buildingType: OUTER/INNER/BASE/INHIB/NEXUS
// - Each time we see a kill event with a position, we update the running mean.
// - We can then render towers at the learned coordinates until their kill time.
//
// Storage key: "towerModel.v1"

export type TowerKey = {
  teamId: 100 | 200;
  lane: "TOP" | "MID" | "BOT" | "INHIBITOR" | "NEXUS" | "UNKNOWN";
  kind: "OUTER" | "INNER" | "BASE" | "INHIB" | "NEXUS" | "UNKNOWN";
};

export type TowerSite = TowerKey & {
  x: number;
  y: number;
  count: number; // how many matches contributed
};

export type TowerModel = Record<string, TowerSite>; // key -> site

const STORAGE_KEY = "towerModel.v1";

// Make a stable string key
function keyOf(k: TowerKey): string {
  return `${k.teamId}|${k.lane}|${k.kind}`;
}

// Map Riot strings -> our canonical lane/kind
function normalizeLane(s?: string): TowerKey["lane"] {
  if (!s) return "UNKNOWN";
  const up = s.toUpperCase();
  if (up.includes("TOP")) return "TOP";
  if (up.includes("MID")) return "MID";
  if (up.includes("BOT")) return "BOT";
  if (up.includes("INHIB")) return "INHIBITOR";
  if (up.includes("NEXUS")) return "NEXUS";
  return "UNKNOWN";
}
function normalizeKind(towerType?: string, buildingType?: string): TowerKey["kind"] {
  const c = (towerType || buildingType || "").toUpperCase();
  if (c.includes("OUTER")) return "OUTER";
  if (c.includes("INNER")) return "INNER";
  if (c.includes("BASE")) return "BASE";
  if (c.includes("INHIB")) return "INHIB";
  if (c.includes("NEXUS")) return "NEXUS";
  return "UNKNOWN";
}

export function loadModel(): TowerModel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as TowerModel;
    return obj ?? {};
  } catch {
    return {};
  }
}
export function saveModel(model: TowerModel) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch {
    // ignore
  }
}

/**
 * Learn/refresh the model from a batch of events.
 * Returns a possibly-updated model (does not mutate the input).
 */
export function learnFromEvents(modelIn: TowerModel, events: Array<{
  kind: string;
  t: number;
  x?: number;
  y?: number;
  teamId?: number;
  lane?: string;
  buildingType?: string;
  towerType?: string;
}>): TowerModel {
  const model: TowerModel = { ...modelIn };

  for (const e of events) {
    if (e.kind !== "BUILDING_KILL") continue;
    if (typeof e.x !== "number" || typeof e.y !== "number") continue;
    if (e.teamId !== 100 && e.teamId !== 200) continue;

    const lane = normalizeLane(e.lane);
    const kind = normalizeKind(e.towerType, e.buildingType);

    const k: TowerKey = { teamId: e.teamId as 100 | 200, lane, kind };
    const key = keyOf(k);

    const prev = model[key];
    if (!prev) {
      model[key] = { ...k, x: e.x, y: e.y, count: 1 };
    } else {
      // Incremental average
      const n = prev.count + 1;
      model[key] = {
        ...prev,
        x: prev.x + (e.x - prev.x) / n,
        y: prev.y + (e.y - prev.y) / n,
        count: n,
      };
    }
  }

  return model;
}

/**
 * At time t, return the towers that should be visible (i.e., learned sites
 * that have NOT yet been destroyed by a kill with a matching key at/before t).
 */
export function getAliveSitesAt(
  model: TowerModel,
  events: Array<{
    kind: string;
    t: number;
    teamId?: number;
    lane?: string;
    buildingType?: string;
    towerType?: string;
  }>,
  tMs: number
): TowerSite[] {
  const killedKeys = new Set<string>();

  for (const e of events) {
    if (e.kind !== "BUILDING_KILL") continue;
    if (e.t > tMs) continue;
    if (e.teamId !== 100 && e.teamId !== 200) continue;
    const lane = normalizeLane(e.lane);
    const kind = normalizeKind(e.towerType, e.buildingType);
    const key = keyOf({ teamId: e.teamId as 100 | 200, lane, kind });
    killedKeys.add(key);
  }

  const sites: TowerSite[] = [];
  for (const key of Object.keys(model)) {
    if (killedKeys.has(key)) continue;
    sites.push(model[key]);
  }
  return sites;
}
