import { useEffect, useState, useRef, useCallback } from "react";

type ReplayEvent = {
  kind: "CHAMP_KILL" | "BUILDING_KILL" | "ELITE_MONSTER_KILL";
  t: number;           // timestamp in milliseconds
  teamId?: 100 | 200;  // which team triggered this event
  killerTeamId?: 100 | 200;  // for kills
  monsterType?: string;      // for epic monsters (DRAGON, BARON, RIFTHERALD)
  buildingType?: string;     // for buildings (TOWER_BUILDING, INHIBITOR_BUILDING)};
};

type Banner = {
  id: number;              // unique identifier for React keys
  type: BannerType;        // what kind of banner to show
  teamId: 100 | 200;       // team color (blue or red)
  text: string;            // display message
  subtext?: string;        // optional secondary text
  bornAt: number;          // when created (performance.now())
  lifeMs: number;          // how long to display (milliseconds)
};

type BannerType = 
  | "KILL"           // Single kill
  | "DOUBLE_KILL"    // 2 kills within 10 seconds
  | "TRIPLE_KILL"    // 3 kills within 10 seconds
  | "QUADRA_KILL"    // 4 kills within 10 seconds
  | "PENTA_KILL"     // 5 kills within 10 seconds (legendary!)
  | "DRAGON"         // Dragon slain
  | "BARON"          // Baron slain
  | "HERALD"         // Rift Herald slain
  | "TOWER"          // Tower destroyed
  | "INHIBITOR"      // Inhibitor destroyed
  | "ACE";           // Team Ace (all 5 enemies dead)
type Props = {
  events: ReplayEvent[];   // all game events from timeline
  timeMs: number;          // current playback position
  width: number;           // map width (for positioning)
 };



export default function EventBanner({ events, timeMs }: Props) {
  // STATE: List of currently active banners
  const [banners, setBanners] = useState<Banner[]>([]);
  
  // REF: Track last processed time to detect new events
  const prevTimeRef = useRef<number>(timeMs);
  
  // REF: Counter for generating unique banner IDs
  const nextIdRef = useRef<number>(1);


  const createBanner = useCallback((
    type: BannerType,
    teamId: 100 | 200,
    text: string,
    subtext?: string
  ) => {
    // Determine how long to show this banner based on importance
    const lifeMs = type.includes("KILL") && type !== "KILL" 
      ? 2500  // Multi-kills show longer (more exciting!)
      : type === "BARON" || type === "ACE"
      ? 3000  // Major events show longest
      : 2000; // Standard duration

    // Create the banner object
    const banner: Banner = {
      id: nextIdRef.current++,
      type,
      teamId,
      text,
      subtext,
      bornAt: performance.now(),
      lifeMs,
    };

    // Add to active banners list
    setBanners(prev => [...prev, banner]);
  }, []);

  /*
   * This effect runs whenever timeMs changes (every frame during playback).
   * It detects when we cross event timestamps and creates appropriate banners.
   * 
   * KEY CONCEPT: We only want to trigger banners when time moves FORWARD.
   * If user scrubs backward, we don't show old events again.
   */
  useEffect(() => {
    const prevTime = prevTimeRef.current;
    const currentTime = timeMs;
    prevTimeRef.current = currentTime;

    // GUARD: Only process when moving forward
    if (currentTime <= prevTime) return;

    // FILTER: Find events that occurred in the time window (prevTime, currentTime]
    const newEvents = events.filter(e => e.t > prevTime && e.t <= currentTime);
    
    if (newEvents.length === 0) return;

  /*
   * Analyzes kill events to detect multi-kills
   * 
   * ALGORITHM:
   * 1. Filter only CHAMP_KILL events
   * 2. Group by team within 10-second windows
   * 3. Count kills per team
   * 4. Generate appropriate banner (DOUBLE, TRIPLE, etc.)
   */
  function processChampionKills(newEvents: ReplayEvent[]) {
    const kills = newEvents.filter(e => e.kind === "CHAMP_KILL");
    if (kills.length === 0) return;

    // Group kills by team
    const blueKills = kills.filter(e => e.killerTeamId === 100);
    const redKills = kills.filter(e => e.killerTeamId === 200);

    // Check each team for multi-kills
    [
      { kills: blueKills, teamId: 100 },
      { kills: redKills, teamId: 200 }
    ].forEach(({ kills: teamKills, teamId }) => {
      if (teamKills.length === 0) return;

      // Multi-kill detection: count kills within our event window
      const killCount = teamKills.length;
      
      if (killCount >= 5) {
        createBanner("PENTA_KILL", teamId as 100 | 200, "PENTA KILL!", "LEGENDARY!");
      } else if (killCount === 4) {
        createBanner("QUADRA_KILL", teamId as 100 | 200, "QUADRA KILL!", "UNSTOPPABLE!");
      } else if (killCount === 3) {
        createBanner("TRIPLE_KILL", teamId as 100 | 200, "TRIPLE KILL!", "DOMINATING!");
      } else if (killCount === 2) {
        createBanner("DOUBLE_KILL", teamId as 100 | 200, "DOUBLE KILL!", "");
      }
      // Single kills - optionally skip or show for first blood only
    });
  }


   // Creates banners for dragon, baron, herald kills

  function processEpicMonsters(newEvents: ReplayEvent[]) {
    const epics = newEvents.filter(e => e.kind === "ELITE_MONSTER_KILL");
    
    epics.forEach(epic => {
      const teamId = epic.teamId || 100;
      
      // Determine monster type and create appropriate banner
      if (epic.monsterType?.includes("DRAGON")) {
        createBanner("DRAGON", teamId, "DRAGON SLAIN", "");
      } else if (epic.monsterType?.includes("BARON")) {
        createBanner("BARON", teamId, "BARON NASHOR", "SLAIN");
      } else if (epic.monsterType?.includes("HERALD")) {
        createBanner("HERALD", teamId, "RIFT HERALD", "SLAIN");
      }
    });
  }

  
   //Creates banners for tower/inhibitor destruction

  function processBuildings(newEvents: ReplayEvent[]) {
    const buildings = newEvents.filter(e => e.kind === "BUILDING_KILL");
    
    buildings.forEach(building => {
      const teamId = building.teamId || 100;
      
      if (building.buildingType?.includes("INHIBITOR")) {
        createBanner("INHIBITOR", teamId, "INHIBITOR", "DESTROYED");
      } else {
        createBanner("TOWER", teamId, "TOWER", "DESTROYED");
      }
    });
  }

    // PROCESS EACH EVENT TYPE
    processChampionKills(newEvents);
    processEpicMonsters(newEvents);
    processBuildings(newEvents);

  }, [timeMs, events, createBanner]);


  
   // Removes banners after their lifetime expires.
   // Runs periodically to check banner ages.
   
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setBanners(prev => 
        prev.filter(banner => now - banner.bornAt < banner.lifeMs)
      );
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [banners.length]); return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {banners.map(banner => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}


    function BannerCard({ banner }: { banner: Banner }) {
  const [progress, setProgress] = useState(0);

  // Animation progress tracker
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    
    function animate() {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / banner.lifeMs);
      setProgress(p);
      
      if (p < 1) {
        raf = requestAnimationFrame(animate);
      }
    }
    
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [banner.lifeMs]);

  // Calculate animation states
  const isEntering = progress < 0.15;  // First 15% = slide in
  const isExiting = progress > 0.8;    // Last 20% = fade out
  
  // Transform for slide-in effect
  const translateY = isEntering ? -50 * (1 - progress / 0.15) : 0;
  
  // Opacity for fade out
  const opacity = isExiting ? (1 - progress) / 0.2 : 1;
  
  // Scale for pulse effect
  const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.05;

  // Team colors
  const colors = {
    100: { bg: "#1e40af", border: "#3b82f6", glow: "rgba(59, 130, 246, 0.5)" },
    200: { bg: "#991b1b", border: "#ef4444", glow: "rgba(239, 68, 68, 0.5)" }
  };
  
  const color = colors[banner.teamId];

  return (
    <div
      style={{
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        transition: "transform 0.3s ease-out",
        padding: "8px 38px",
        background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
        border: `3px solid ${color.border}`,
        borderRadius: 12,
        boxShadow: `0 8px 32px ${color.glow}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
        textAlign: "center",
        minWidth: 350,
      }}
    >
      <div 
      style={{ 
        fontFamily: "Friz Quadrata, serif",
        fontSize: 20, 
        fontWeight: 900, 
        color: "#fff",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        letterSpacing: 2,
      }}>
        {banner.text}
      </div>
      {banner.subtext && (
        <div 
          style={{ 
            fontFamily: "Friz Quadrata, serif",
            fontSize: 12, 
            fontWeight: 600,
            color: "#fef3c7",
            marginTop: 4,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}>
          {banner.subtext}
        </div>
      )}
    </div>
  );
}