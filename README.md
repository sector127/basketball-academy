# Brooklyn Basketball Academy — Tbilisi

Academy management app: teams, players, coaches, games and box scores, practice
calendar and season planner, venues, a tactical playbook, and portals for players
and guardians.

Built with Next.js 15, MongoDB (Mongoose), Auth.js and next-intl (English / Georgian).

## Requirements

- Node.js 22+
- [pnpm](https://pnpm.io) 12 (`packageManager` in `package.json`)
- MongoDB 7+ (a local install on `localhost:27017`, or Docker)

## Getting started

```bash
pnpm install
cp .env.example .env.local      # then set AUTH_SECRET: openssl rand -base64 32
pnpm seed                       # demo teams, players, events
node addUser.mjs                # demo admin and coach accounts
pnpm dev                        # http://localhost:3000
```

Demo logins (development only): `admin@bba.ge` / `admin123`, `nika@bba.ge` / `password123`.

## Configuration

See `.env.example`. The important ones:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Database connection |
| `AUTH_SECRET` | Signs login sessions; keep it secret and stable |
| `AUTH_URL` / `APP_URL` | Public address; used in emailed links |
| `ACADEMY_TIME_ZONE` | Time zone for schedules (default `Asia/Tbilisi`) |
| `UPLOAD_DIR` | Where uploaded photos are stored (default `./uploads`) |
| `SMTP_URL`, `EMAIL_FROM` | Optional: email password resets. Without them, an admin resets passwords on the Accounts page. `EMAIL_TRANSPORT=console` prints emails to the log in development. |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server with hot reload |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm test` | Test suite (Vitest; starts its own temporary MongoDB, no setup needed) |
| `pnpm check` | Type check + lint + tests: run before committing |
| `pnpm seed` | Load demo data |

## Roles

- **admin**: everything, including the Accounts page (approve sign-ups, link players/guardians, reset passwords)
- **staff**: read-only view of the admin pages
- **coach**: their own teams, players, attendance, results and skills sessions
- **player / guardian**: their linked player's schedule, attendance and stats; academy calendar and playbook

New users request an account at `/register`; an admin approves it and links it to a player record.

## Docker

```bash
docker build --target prod -t basketball-academy .
docker run -d --name basketball-academy --network host \
  -e MONGODB_URI=mongodb://127.0.0.1:27017/basketball \
  -e AUTH_SECRET='...' -e AUTH_URL=http://localhost:3000 \
  -v basketball_uploads:/app/uploads \
  basketball-academy
```

`docker compose up --build` runs a development setup with its own MongoDB
(set `AUTH_SECRET` first). Uploaded photos live in the `/app/uploads` volume.
