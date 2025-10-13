// web/src/lib/gameState.ts
// Derives "live game state at time T" from timeline events.
// - Who is dead at T? (we approximate respawn by a fixed death window for now)
// - Which towers (and later inhib/nexus structures) have been destroyed up to T?
// - Which big objectives are currently "up" (spawned and not yet killed)?
//
// You can refine this later with real respawn curves and respawn events.

import type { ReplayEvent } from "./riotTimeline";

/*  Config knobs */

// Until we implement proper respawn logic, use a fixed death window (ms).
export const DEFAULT_DEATH_WINDOW_MS = 30_000; // 30 seconds

// Objective spawn times (ms since game start). Rough defaults:
export const HERALD_SPAWN_MS = 8 * 60 * 1000;   // 8:00
export const HERALD_DESPAWN_MS = 20 * 60 * 1000; // 20:00 (rough)
export const BARON_SPAWN_MS  = 20 * 60 * 1000;  // 20:00
export const DRAGON_SPAWN_MS = 5 * 60 * 1000;   // first dragon ~5:00

/*  Types we return to the UI  */

export type LiveState = {
  // Participants (by participantId) that are currently dead at time T
  dead: Set<number>;
  // Tower sites that have been destroyed up to time T
  destroyedTowers: { x: number; y: number }[];
  // Which “big objectives” are currently up
  objectivesUp: {
    dragon: boolean;
    baron: boolean;
    herald: boolean;
  };
};

/*  Core calculator  */

/**
 * Compute live state at time `tMs` by scanning events up to that time.
 * @param events full event list (already normalized by extractEvents)
 * @param tMs current playback time (ms)
 * @param deathWindowMs how long a champ stays dead after a kill (approx)
 */
export function computeLiveState(
  events: ReplayEvent[],
  tMs: number,
  deathWindowMs = DEFAULT_DEATH_WINDOW_MS
): LiveState {
  const dead = new Set<number>();
  const destroyedTowers: { x: number; y: number }[] = [];

  // Track latest death timestamp per victim to decide whether they’re still dead
  const lastDeath: Record<number, number> = {};

  // Track deaths of epic monsters to flip “up” flags
  let lastDragonDeathAt = -Infinity;
  let lastBaronDeathAt = -Infinity;
  let lastHeraldDeathAt = -Infinity;

  for (const e of events) {
    if (e.t > tMs) break; // events are chronological enough

    if (e.kind === "CHAMP_KILL" && typeof e.victimId === "number") {
      lastDeath[e.victimId] = e.t;
    }

    if (e.kind === "BUILDING_KILL") {
      // We only remove towers (later you can filter on buildingType if you add it)
      if (typeof e.x === "number" && typeof e.y === "number") {
        destroyedTowers.push({ x: e.x, y: e.y });
      }
    }

    if (e.kind === "ELITE_MONSTER_KILL") {
      const m = e.monsterType?.toUpperCase() || "";
      if (m.includes("DRAGON")) lastDragonDeathAt = e.t;
      else if (m.includes("BARON")) lastBaronDeathAt = e.t;
      else if (m.includes("HERALD")) lastHeraldDeathAt = e.t;
    }
  }

  // Decide who is dead at tMs
  for (const pidStr of Object.keys(lastDeath)) {
    const pid = Number(pidStr);
    const diedAt = lastDeath[pid];
    if (tMs - diedAt < deathWindowMs) {
      dead.add(pid);
    }
  }

  // Objectives "up" flags — naive but useful:
  const dragonUp = tMs >= DRAGON_SPAWN_MS && tMs > lastDragonDeathAt + 5 * 60 * 1000; // respawn ~5m later (very rough)
  const heraldUp = tMs >= HERALD_SPAWN_MS && tMs < HERALD_DESPAWN_MS && tMs > lastHeraldDeathAt + 6 * 60 * 1000;
  const baronUp  = tMs >= BARON_SPAWN_MS  && tMs > lastBaronDeathAt + 6 * 60 * 1000;

  return {
    dead,
    destroyedTowers,
    objectivesUp: {
      dragon: dragonUp,
      baron: baronUp,
      herald: heraldUp,
    },
  };
}
