# SSS+Dealer

The project is separated into two application folders:

```text
FrontEnd/
  public/              HTML pages, CSS, browser JavaScript, images, admin pages
  src/                 Frontend server and forwarding to the backend
  package.json
BackEnd/
  src/
    controllers/       Feature logic
    routes/            All /api endpoints
    middleware/        Authentication and admin access
    config/            Environment and Cloudinary configuration
    lib/               Database pool and server helpers
    app.js             Express application
    server.js          Backend entry point
  database/            SQL schema, initialization, and seed scripts
  uploads/             Existing local uploads
  scripts/             Project launcher and syntax checker
  tests/               API, frontend, and startup checks
  package.json
.env                   Local configuration (not committed)
.env.example           Configuration template
package.json           Commands for running the project
package-lock.json
```

## Setup

Use Node.js 22 or newer and npm. From the project root, install dependencies for both folders:

```sh
npm install
```

Keep your existing root `.env`, or copy `.env.example` to `.env` and fill in the MySQL/TiDB, JWT, and Cloudinary values. The database schema and existing records need no migration for this folder change.

## Run the project

From the project root:

```sh
npm start
```

For automatic restarts when server code changes:

```sh
npm run dev
```

Open <http://localhost:3000>. The frontend listens on port 3000 and the backend on port 3001. The frontend forwards `/api/*` and `/uploads/*` directly to the backend, so the existing pages and browser API URLs continue to work. Static frontend edits only need a browser refresh.

On PowerShell systems that block `npm.ps1`, use `npm.cmd` instead of `npm`.

## Run each folder separately

In one terminal:

```sh
cd BackEnd
npm start
```

In another terminal:

```sh
cd FrontEnd
npm start
```

You can also use `npm run start:backend` and `npm run start:frontend` from the root. Both applications load the root `.env` regardless of the working directory. Set `ENV_FILE` to load a different file; existing process environment variables take precedence.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `FRONTEND_PORT` | `PORT`, then `3000` | Frontend listener |
| `BACKEND_PORT` | `3001` | Backend listener |
| `BACKEND_URL` | `http://127.0.0.1:<BACKEND_PORT>` | Backend origin used by the frontend |
| `HOST` | Frontend: `0.0.0.0`; backend: `127.0.0.1` | Listener address override; the example environment binds both locally |
| `PROXY_TIMEOUT_MS` | `30000` | Backend socket inactivity timeout |
| `CORS_ORIGINS` | Development: request origin; production: disabled | Comma-separated allowed origins for direct API access |
| `DB_POOL_SIZE` | `10` | Maximum connections in the backend pool |
| `DB_CONNECT_TIMEOUT_MS` | `10000` | Database connection timeout |
| `UPLOADS_DIR` | `BackEnd/uploads/` | Optional override for existing local uploads |

The backend owns authentication, accounts, cars, favorites, comparisons, test drives, leads, database access, and photo uploads. The frontend owns page and asset delivery. Both have their own package manifest and start command. New photos continue to use Cloudinary, while existing local uploads are kept in `BackEnd/uploads`.

## Database commands

For a new database, run these commands from the project root:

```sh
npm run db:init
npm run db:seed
```

These commands now use `BackEnd/database`. Startup does not modify or seed the database. The existing seed script replaces sample leads; run it only when you intend to seed data. The existing schema script also promotes the `owen` username to admin.

## Validation

```sh
npm run check
npm test
```

Tests use local HTTP servers and mocked database and Cloudinary adapters. They do not write to your database or upload images to Cloudinary. Startup checks run the actual frontend and backend entry points with isolated test configuration.
