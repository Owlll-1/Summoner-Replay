export type Position = { x: number; y: number };
export const MAP_SIZE = 14820; // SR world coords are ~0..14820 on both axes

// ------- Match (subset) -------
export interface RiotMatchParticipant {
  participantId: number;
  summonerName?: string;
  championName?: string;
  teamId?: 100 | 200;
}

export interface RiotMatchInfo {
  participants?: RiotMatchParticipant[];
}

export interface RiotMatch {
  info?: RiotMatchInfo;
}

// ------- Timeline (subset) -------
export interface RiotParticipantFrame {
  // Some frames omit position (dead/recall/base), so it's optional.
  position?: Position;
}

export type RiotParticipantFrames = Record<string, RiotParticipantFrame>;

export interface RiotTimelineEventBase {
  type: string;
  timestamp?: number;
  position?: Position;
}

export interface RiotChampKillEvent extends RiotTimelineEventBase {
  type: "CHAMPION_KILL";
  killerId?: number;
  victimId?: number;
}

export interface RiotBuildingKillEvent extends RiotTimelineEventBase {
  type: "BUILDING_KILL";
  laneType?: string;
  teamId?: number;
}

export interface RiotEliteMonsterKillEvent extends RiotTimelineEventBase {
  type: "ELITE_MONSTER_KILL";
  killerId?: number;
  monsterType?: string;
}

export type RiotTimelineEvent =
  | RiotChampKillEvent
  | RiotBuildingKillEvent
  | RiotEliteMonsterKillEvent
  | RiotTimelineEventBase;

export interface RiotTimelineFrame {
  timestamp?: number; // ms since game start
  participantFrames?: RiotParticipantFrames;
  events?: RiotTimelineEvent[];
}

export interface RiotTimelineInfo {
  frames?: RiotTimelineFrame[];
}

export interface RiotTimeline {
  info?: RiotTimelineInfo;
}

// ------- Frontend-friendly, normalized types -------
export type ParticipantLite = {
  participantId: number;
  summonerName: string;
  championName: string;
  teamId: 100 | 200;
  kills: number;
  deaths: number;
  assists: number;
};
export type Frame = {
  t: number; // ms since start
  positions: Record<number, Position | undefined>;
};

export type ReplayEvent =
  | { kind: "CHAMP_KILL"; t: number; x?: number; y?: number; killerId?: number; victimId?: number }
  | { kind: "BUILDING_KILL"; t: number; x?: number; y?: number; lane?: string; teamId?: number }
  | { kind: "ELITE_MONSTER_KILL"; t: number; x?: number; y?: number; monsterType?: string; killerId?: number };

// ===================================================
// Helpers (type-safe, no `any`)
// ===================================================

export function parseParticipants(match: RiotMatch): ParticipantLite[] {
  const arr = match.info?.participants ?? [];
  const out: ParticipantLite[] = [];

  for (const p of arr) {
    const pid = toNumberOrDefault(p.participantId, 0);
    if (!pid) continue;

    // Note: these exist on match.info.participants in Match-V5
    const kills = toNumberOrDefault((p as unknown as { kills?: number }).kills, 0);
    const deaths = toNumberOrDefault((p as unknown as { deaths?: number }).deaths, 0);
    const assists = toNumberOrDefault((p as unknown as { assists?: number }).assists, 0);

    out.push({
      participantId: pid,
      summonerName: toStringOrDefault(p.summonerName, "Unknown"),
      championName: toStringOrDefault(p.championName, "Unknown"),
      teamId: (p.teamId === 200 ? 200 : 100) as 100 | 200,
      kills,
      deaths,
      assists,
    });
  }

  return out.sort((a, b) => a.participantId - b.participantId);
}


export function extractFrames(timeline: RiotTimeline | null): Frame[] {
  const framesSrc = timeline?.info?.frames ?? [];
  const frames: Frame[] = [];

  for (const f of framesSrc) {
    const t = toNumberOrDefault(f.timestamp, 0);
    const pf = f.participantFrames ?? {};

    const positions: Record<number, Position | undefined> = {};
    for (const key of Object.keys(pf)) {
      const pid = Number(key);
      const pos = pf[key]?.position;
      if (isPosition(pos)) {
        positions[pid] = { x: pos.x, y: pos.y };
      } else {
        positions[pid] = undefined;
      }
    }

    frames.push({ t, positions });
  }

  frames.sort((a, b) => a.t - b.t);
  return frames;
}

export function extractEvents(timeline: RiotTimeline | null): ReplayEvent[] {
  const out: ReplayEvent[] = [];
  const framesSrc = timeline?.info?.frames ?? [];

  for (const f of framesSrc) {
    const t = toNumberOrDefault(f.timestamp, 0);
    for (const e of f.events ?? []) {
      switch (e.type) {
        case "CHAMPION_KILL": {
          const ek = e as RiotChampKillEvent;
          out.push({
            kind: "CHAMP_KILL",
            t,
            x: toNumberOrUndef(ek.position?.x),
            y: toNumberOrUndef(ek.position?.y),
            killerId: toNumberOrUndef(ek.killerId),
            victimId: toNumberOrUndef(ek.victimId),
          });
          break;
        }
        case "BUILDING_KILL": {
          const eb = e as RiotBuildingKillEvent;
          out.push({
            kind: "BUILDING_KILL",
            t,
            x: toNumberOrUndef(eb.position?.x),
            y: toNumberOrUndef(eb.position?.y),
            lane: toStringOrUndef(eb.laneType),
            teamId: toNumberOrUndef(eb.teamId),
          });
          break;
        }
        case "ELITE_MONSTER_KILL": {
          const em = e as RiotEliteMonsterKillEvent;
          out.push({
            kind: "ELITE_MONSTER_KILL",
            t,
            x: toNumberOrUndef(em.position?.x),
            y: toNumberOrUndef(em.position?.y),
            killerId: toNumberOrUndef(em.killerId),
            monsterType: toStringOrUndef(em.monsterType),
          });
          break;
        }
        default:
          // ignore other event types for now
          break;
      }
    }
  }

  return out; // already chronological enough by frame order
}

export function neighborFrames(frames: Frame[], t: number): { prev: Frame; next: Frame } | null {
  if (frames.length === 0) return null;
  if (t <= frames[0].t) return { prev: frames[0], next: frames[0] };
  const last = frames[frames.length - 1];
  if (t >= last.t) return { prev: last, next: last };

  // binary search for neighbors
  let lo = 0;
  let hi = frames.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const mt = frames[mid].t;
    if (mt === t) return { prev: frames[mid], next: frames[mid] };
    if (mt < t) lo = mid + 1;
    else hi = mid - 1;
  }
  const i = Math.max(1, lo);
  return { prev: frames[i - 1], next: frames[i] };
}

/**
 * Dead-reckoning: interpolate between prev/next anchors with a speed cap.
 */
export function predictPosition(
  prev: Position | undefined,
  next: Position | undefined,
  prevT: number,
  nextT: number,
  t: number,
  speedCapUnitsPerSec = 1800 // tune this later
): Position | undefined {
  if (!prev && !next) return undefined;
  if (prev && !next) return prev;
  if (!prev && next) return next;

  // both exist
  const dt = Math.max(1, nextT - prevT); // ms
  const alpha = clamp01((t - prevT) / dt);
  const x = lerp(prev!.x, next!.x, alpha);
  const y = lerp(prev!.y, next!.y, alpha);

  // cap movement from prev by max speed
  const maxDist = (speedCapUnitsPerSec * Math.max(0, t - prevT)) / 1000;
  const dx = x - prev!.x;
  const dy = y - prev!.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= maxDist) return { x, y };
  if (maxDist <= 0) return { x: prev!.x, y: prev!.y };
  const scale = maxDist / dist;
  return { x: prev!.x + dx * scale, y: prev!.y + dy * scale };
}

// ===================================================
// Small, typed utilities (no `any`)
// ===================================================

function isPosition(v: unknown): v is Position {
  if (
    typeof v === "object" &&
    v !== null &&
    "x" in v &&
    "y" in v &&
    typeof (v as { x: unknown }).x === "number" &&
    typeof (v as { y: unknown }).y === "number"
  ) {
    return true;
  }
  return false;
}

function toNumberOrUndef(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function toStringOrUndef(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function toNumberOrDefault(v: unknown, d: number): number {
  return typeof v === "number" ? v : d;
}
function toStringOrDefault(v: unknown, d: string): string {
  return typeof v === "string" ? v : d;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
// Splits participants into blue (teamId 100) and red (teamId 200)
export function splitTeams(ps: ParticipantLite[]): {
  blue: ParticipantLite[];
  red: ParticipantLite[];
} {
  const blue = ps.filter((p) => p.teamId === 100);
  const red = ps.filter((p) => p.teamId === 200);
  return { blue, red };
}
