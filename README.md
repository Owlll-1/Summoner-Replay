# Summoner Replay — League of Legends 2D Match Replay Viewer

Summoner Replay is a web app that replays completed **Summoner’s Rift** matches on a 2D map. It fetches match data from Riot’s public APIs and visualizes champion movement and key events to help players (and coaches) review games at a glance.

> Status: **WIP / MVP in progress** — this README documents the intended architecture and setup so the team can build against it.

---

## ✨ Goals

- Enter a **Riot ID** or **Match ID** and load recent matches
- Play a **2D replay**: champion positions, kills, objectives, and timelines
- Provide **basic playback controls** (play/pause, speed, scrub)
- Show **team rails** (champions, K/D/A) and light stats

---

## 🧰 Tech Stack (target)

- **Frontend:** React + Vite + TypeScript • HTML5 Canvas (map rendering)
- **Backend:** Node.js + Express + TypeScript (proxy to Riot API)
- **API:** Riot **Match-V5** & **Timeline-V5**
- **Tooling:** ESLint/Prettier • GitHub Issues/Projects

> If you start frontend-only, you can stub data or call a simple JSON mock; adding the Express proxy later is straightforward.

---

## 🗂️ Project Structure


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

## 🚀 Getting Started
SETUP INSTRUCTIONS

Clone the repo
git clone https://github.com/Owlll-1/Summoner-Replay.git

cd Summoner-Replay

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

## 🎮 How to Use

1.Open the app and go to Replay.
2.Enter a Riot ID (e.g., Crocodice#431) or a specific Match ID (e.g., NA1_1234567890).
3.Choose a match → click Play replay.
4.Use play/pause, speed, and the scrubber to navigate the match.
5.Watch blue/red “champion dots” traverse the Rift with team rails updating K/D/A and events.

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
