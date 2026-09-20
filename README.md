# Arenafy

A unified MERN-stack tournament platform for cricket, football, and PUBG — built around one core idea: the engine that runs fixtures, brackets, and standings should never need to know which sport it's running.

Instead of hardcoding sport-specific rules into the core, each discipline plugs in through a single result-processor module. Adding a new sport means writing one small file and registering it — zero changes to the match engine, the bracket generator, or the standings logic.

## Why this architecture

Most student tournament projects hardcode logic per sport — `if (sport === 'cricket') { ... } else if (sport === 'pubg') { ... }` scattered through the controller. That breaks down the moment a third sport shows up, and it did here too, in an early design pass.

The fix: every match result, regardless of sport or participant count, gets normalized into one generic shape:

```js
outcome: [{ teamId, rank, points, displayStat }]
```

Cricket and football are pairwise — two teams, one winner. PUBG is N-ary — any number of squads, ranked by placement. Both produce the exact same `outcome[]` shape, so every downstream system (standings tables, bracket advancement, result correction) reads one format and never branches on discipline.

Adding football to this project took one new file (`football.resultProcessor.js`) and one registry line — the match controller, the standings builder, and the bracket generator were never touched.

## Features

- **Three tournament formats** — round robin, single elimination, and points league
- **Properly seeded brackets** with automatic bye handling for any participant count, not just powers of two (standard recursive tournament seeding, so top seeds are split across the draw and byes go to the weakest seeds)
- **Live standings** that recompute from scratch on every result — no incremental math to get wrong, no stale numbers
- **Result correction** with cascade protection — an organizer can fix a mistaken score, but only while the next round hasn't already been played on top of it
- **Roster snapshots that freeze at registration approval**, not at submission — a team's roster can change mid-tournament without rewriting history
- **OTP-based password reset** with a resend cooldown and attempt limiting, instead of email reset links
- **Public tournament browsing** for logged-out visitors, with all mutating actions still gated server-side
- **Fully responsive UI**, dark theme, discipline-specific accent colors and imagery

## Tech stack

**Frontend:** React (Vite), React Router, Axios, lucide-react
**Backend:** Node.js, Express, REST API
**Database:** MongoDB Atlas + Mongoose
**Auth:** JWT + bcrypt, OTP-based password reset via Nodemailer

## Architecture overview
server/src/
discipline/
registry.js → maps 'cricket' | 'pubg' | 'football' to a result processor
cricket/cricket.resultProcessor.js
pubg/pubg.resultProcessor.js
football/football.resultProcessor.js
controllers/
match.controller.js → the engine: fixtures, brackets, standings — never imports discipline code directly, only talks to the registry
models/
Match.js → generic outcome[] shape, works for 2-team or N-team results alike

Key design decisions:
- **Standings dispatch by format, not discipline.** `round_robin` always builds a played/won/lost/tied table; `points_league` always builds a cumulative points/best-placement table. A new discipline reusing an existing format needs zero new standings code.
- **Win/tie/loss is derived from rank, not points.** Early on, standings classified results by checking for specific point values (`points === 2` for a win). That silently broke the moment football's 3-point win scoring was added, since `3` matched neither the win nor loss check and fell through to "tied." Fixed by deriving the result from how many teams share rank 1 in the match — this works identically regardless of what scoring scheme any given discipline uses.
- **Result submission is transactional** (`mongoose.startSession()`), with an idempotency guard preventing double-processing of the same match.
- **Bracket generation is deterministic and seeded**, built backward from the Final so each match already has its next round's ID before creation, then resolves byes and pushes winners forward in a single transaction.

## Running locally

```bash
# Backend
cd server
npm install
cp .env.example .env   # fill in your own MongoDB URI, JWT secret, Gmail app password
npm run dev

# Frontend
cd client
npm install
npm run dev
```

Backend runs on `:5000`, frontend on `:5173`.

## Known limitations

- Single-elimination brackets require a bracket size that's a power of two after byes are applied — non-power-of-two participant counts are handled via byes, not via a different bracket shape
- `Tournament.stages` exists as a schema placeholder for future multi-stage tournaments (group stage → knockout) but isn't implemented yet
- Result correction only supports one level of cascade — if a bracket match's result is corrected after its winner has already played and completed the next round, the organizer must correct that next match first