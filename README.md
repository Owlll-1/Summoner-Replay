# LoL-replay
League of Legend 2D Match-Replay
LoL Replay

A web-based League of Legends match replay viewer that uses Riot’s official Match-V5 and Timeline-V5 APIs.

Watch Summoner’s Rift matches unfold on a 2D map — see champion positions, major events, and team stats in real time.

FEATURES (Current MVP)

Resolve matches by Riot ID (e.g., Crocodice#431)

Fetch match + timeline from Riot’s API

Display a 2D Summoner’s Rift map with moving champion dots

Dead-reckoning between timeline frames for smooth motion

Team rails showing roster, champions, and K/D/A

Playback controls: play/pause, speed, scrubber

Type-safe full-stack (Node + Express + React + TypeScript)

PROJECT STRUCTURE

LoL-replay/
│
├── server/ (Express backend)
│ ├── src/
│ │ ├── index.ts main server file (routes)
│ │ ├── riot.ts helper to call Riot API
│ │ └── regions.ts region mapping logic
│ ├── .env your RIOT_API_KEY (not committed)
│ └── package.json
│
├── web/ (React + Vite frontend)
│ ├── src/
│ │ ├── pages/ Landing, Login, Replay
│ │ ├── components/ MapCanvas, MatchFinder, TeamRail
│ │ ├── lib/riotTimeline.ts timeline parsing + dead-reckoning
│ │ └── api.ts frontend fetch helpers
│ └── package.json
│
└── README.md

SETUP INSTRUCTIONS

Clone the repo
git clone https://github.com/YOUR_USERNAME/LoL-replay.git

cd LoL-replay

Backend setup (Express server)
cd server
npm install

Create a .env file in the server folder:

RIOT_TOKEN=RGAPI-your-riot-api-key-here
PORT=5050

Run the backend:
npm run dev

You should see:
server running on http://localhost:5050

Frontend setup (Vite + React)
Open a new terminal tab and run:
cd web
npm install
npm run dev

You should see:
VITE ready
Local: http://localhost:5173/

Visit http://localhost:5173
 in your browser.

HOW TO USE

Go to the Replay page.

Enter a Riot ID (like Crocodice#431) or a Match ID (like NA1_1234567890).

Click Find to load recent matches.

Click Play replay on any match.

The map loads and you can play, pause, change speed, or scrub through time.

If the match has a timeline, you’ll see blue/red champion dots moving across the map with team stats on both sides.

TECH STACK

Frontend: React + Vite + TypeScript
Backend: Node.js + Express + TypeScript
API: Riot Match-V5 & Timeline-V5
Styling: Inline styles (Tailwind planned)
Rendering: HTML5 Canvas (for map + champion icons)

SCRIPTS

Backend (server/)
npm run dev Start server in development mode

Frontend (web/)
npm run dev Start Vite dev server
npm run build Build for production
npm run preview Preview built site locally

ENVIRONMENT VARIABLES

RIOT_TOKEN Your Riot API key (required)
PORT Backend port (default 5050)
