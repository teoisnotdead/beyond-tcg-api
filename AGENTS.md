# AGENTS.md

## Commands
- Use npm; `package-lock.json` is the lockfile.
- Dev server: `npm run start:dev`. Swagger is at `/api/docs`; API routes are prefixed with `/api`.
- Build/compile check: `npm run build`.
- Lint: `npm run lint` runs ESLint with `--fix`, so it mutates files.
- Format: `npm run format` only formats `src/**/*.ts` and `test/**/*.ts`.
- Unit tests: `npm test`. Focused unit test example: `npm test -- users/users.service.spec.ts` because Jest `rootDir` is `src`.
- Integration DB: `npm run test:db:up` and `npm run test:db:down`.
- Integration tests: `npm run test:int`. Focused integration test example: `npm run test:int -- integration/purchases.int-spec.ts` because Jest `rootDir` is `test`.
- E2E tests: `npm run test:e2e`; these import the real `AppModule`, so a configured Postgres database is required.

## Database And Env
- Local compose DB is `postgres/postgres` on port `5432` with database `beyond_tcg`.
- `EnvConfig` defaults to database `beyond_game_tcg` with empty password, so set `.env` when using `docker-compose.yml`.
- Migrations load `.env` through `src/config/typeorm.config.ts`; run `npm run migration:run` after the DB is available.
- Runtime TypeORM uses the explicit entity list in `src/app.module.ts` with `synchronize: false`; it does not use the CLI glob from `typeorm.config.ts`.
- Integration tests use a separate hard-coded entity list in `test/utils/test-db.module.ts`, with `synchronize: true` and `dropSchema: true`.
- `npm run seed:dev` uses direct SQL and assumes migration seed data for plans, categories, and languages already exists.

## App Wiring
- `src/main.ts` registers global validation with whitelist, transform, and `forbidNonWhitelisted`; DTOs need decorators for accepted fields.
- Successful responses are globally wrapped as `{ success: true, ... }`; errors are normalized by `GlobalHttpExceptionFilter`.
- `HeadersModule` applies header validation to almost every HTTP route; Swagger and Google OAuth routes are excluded.
- Required request headers include `x-platform`, `x-client-version`, `x-app-language`, `x-channel`, `x-environment`, and `x-environment-id`.
- When adding a new entity, check both `src/app.module.ts` and `test/utils/test-db.module.ts`.

## Testing Notes
- Default unit Jest config maps `@nestjs/passport` and `bcrypt` to local mocks under `test/mocks`.
- Integration tests use Postgres at `127.0.0.1:5433`, database `beyond_tcg_test`, user `test_user`, password `test_password`.
- `clearDatabase` truncates all integration-test tables before each test.

## Style
- Prettier uses single quotes and trailing commas.
- ESLint is type-aware; `no-explicit-any` is off, while floating promises and unsafe arguments are warnings.
