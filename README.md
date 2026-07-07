# ResQ AI — Autonomous Multi-Agent Disaster Intelligence Platform

Enterprise-grade emergency response platform powered by AI agents for real-time disaster coordination, resource management, and multi-role command center operations.

## Architecture

```
┌──────────────────────────┐     ┌───────────────────────┐
│   Frontend (Next.js 15)  │────▶│   Backend (Express)   │
│   Port 3000              │◀────│   Port 5000           │
│   AWS Amplify            │     │   Elastic Beanstalk   │
└──────────────────────────┘     └───────────┬───────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  PostgreSQL RDS │
                                    │  + Prisma ORM   │
                                    └─────────────────┘
```

## Roles

| Role | Dashboard | Credentials |
|------|-----------|-------------|
| **Government** | Command Center, Live Map, Active SOS, AI Agents | `gov@resqai.com` |
| **Hospital** | Bed Management, Incoming Triage | `hospital@resqai.com` |
| **NGO** | Resource inventory, Volunteer roster, Distribution | `ngo@resqai.com` |
| **Volunteer** | Task list, Map view | `volunteer@resqai.com` |
| **Citizen** | Send SOS, Shelters, Alerts | `citizen@resqai.com` |
| **Admin** | System overview, User management, AI Models | `admin@resqai.com` |

All demo accounts use password: `password123`

## Tech Stack

**Frontend:** Next.js 15, React 19, Tailwind CSS 4, Recharts, Leaflet, Supabase SSR Auth, Socket.IO Client, Lucide Icons

**Backend:** Express, Prisma ORM, PostgreSQL, Socket.IO, JWT auth, bcrypt, Helmet, Swagger docs

**AI:** Google Gemini API (with offline rule-based fallback), free OSRM routing (with Google Maps fallback), Open-Meteo weather (with OpenWeatherMap fallback)

## Quick Start

```bash
# Prerequisites: Node.js 20+, PostgreSQL running locally

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set up database
cp .env.example .env          # Edit DATABASE_URL to point to your local PostgreSQL
npx prisma generate
npx prisma db push
npx prisma db seed

# Start both servers
bash start-dev.sh
```

Open http://localhost:3000 and sign in with any demo account.

## Project Structure

```
├── backend/
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handling
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic (auth, maps, weather, gemini)
│   ├── socket/              # WebSocket handlers
│   ├── scripts/             # Data seeders
│   └── server.js            # Entry point
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── citizen/         # Citizen dashboard
│   │   ├── government/      # Government command center
│   │   ├── hospital/        # Hospital dashboard
│   │   ├── ngo/             # NGO dashboard
│   │   ├── resources/       # Synthetic dataset resource overview
│   │   └── volunteer/       # Volunteer dashboard
│   ├── components/          # Shared UI (DashboardLayout, LiveMap, etc.)
│   └── utils/               # API client, Socket.IO client
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.js              # Initial user/hospital/shelter seed
│   └── migrations/          # Prisma migrations
└── start-dev.sh             # Launches both servers
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/google` | Google OAuth |
| GET | `/api/v1/auth/stats` | Public dashboard stats |
| GET | `/api/v1/hospitals` | Hospital list |
| GET | `/api/v1/shelters` | Shelter list |
| GET | `/api/v1/data/ngos` | NGO directory |
| GET | `/api/v1/data/warehouses` | Warehouse inventory |
| GET | `/api/v1/data/supplies` | Supply listings |
| GET | `/api/v1/data/government-offices` | Government directory |
| GET | `/api/v1/data/fire-stations` | Fire stations |
| GET | `/api/v1/data/district-overview` | District-wise aggregation |
| GET | `/docs` | Swagger API docs |
| GET | `/health` | Health check |

## Env Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (use `openssl rand -hex 64`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase service role key |
| `FRONTEND_URL` | Yes | Frontend origin (for CORS/OAuth) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same Supabase URL for browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser client |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL for browser API calls |
| `GEMINI_API_KEY` | No | Google Gemini (falls back to offline parsing) |
| `MAPS_API_KEY` | No | Google Maps (falls back to free OSRM) |
| `WEATHER_API_KEY` | No | OpenWeatherMap (falls back to free Open-Meteo) |

## Deployment

See [AWS Deployment Guide](#) for detailed instructions on deploying to Elastic Beanstalk + Amplify + RDS.
