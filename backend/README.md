# Pylon API

Express + TypeScript + MongoDB backend with layered architecture.

## Structure

```
src/
  config/         # env, database, app config
  constants/      # HTTP status, messages, collection names
  controllers/    # request/response handlers
  helpers/        # logger, crypto, response helpers
  middleware/     # auth, validate, error handlers
  models/         # Mongoose schemas
  repositories/   # data-access layer
  routes/         # Express routers
  services/       # business logic
  types/          # shared TypeScript types
  utils/          # AppError, asyncHandler
  validators/     # Zod schemas
  app.ts          # Express app factory
  server.ts       # bootstrap + graceful shutdown
```

## Scripts

```bash
npm run dev       # tsx watch
npm run build     # compile to dist/
npm start         # run dist/server.js
npm run typecheck
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | No | Health check |
| POST | `/api/v1/users/register` | No | Register |
| POST | `/api/v1/users/login` | No | Login |
| GET | `/api/v1/users/me` | Yes | Current user |
| GET | `/api/v1/users` | Yes | List users |

Copy `.env.example` to `.env` and set `MONGODB_URI` before starting.
