# TypeScript Monorepo Template

English | [简体中文](README.zh-CN.md)

A TypeScript monorepo with NestJS, pnpm, and Turborepo. Shared tooling, strict type checking, and standalone server builds are configured out of the box.

<!-- web:start -->

Includes a React + Vite frontend and shared UI components by default.

<!-- web:end -->

## Quick start

Requires **Node.js >= 24.20.0** and **pnpm 11.24.0**. The tested Node.js version is recorded in [`.node-version`](.node-version).

```sh
pnpm dlx degit lixinqiany/ts-monorepo-template-with-react my-project
cd my-project
pnpm install --frozen-lockfile
pnpm dev:server
```

The API runs at <http://127.0.0.1:3000/api>. Internal packages use `@repo/*`; no package renaming or setup script is required. Update the root package metadata for your project and run `git init` to start its history.

<!-- web:start -->

Run `pnpm dev:web` in another terminal and open <http://127.0.0.1:5173>. Vite proxies `/api` to the backend.

### Backend only

In a fresh copy, **before installing dependencies**, run:

```sh
node scripts/init.ts --no-web
pnpm install --no-frozen-lockfile
```

This removes Web, UI, and their configuration and dependencies. Commit the updated lockfile, then use frozen installs as usual.

<!-- web:end -->

## Structure

| Path                         | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `apps/server`                | NestJS API, compiled with Rspack / SWC               |
| `packages/core`              | Shared Node.js code, built with tsdown               |
| `packages/typescript-config` | Shared strict TypeScript settings                    |
| `packages/eslint-config`     | Shared ESLint rules, compatible with Prettier        |
| `scripts/build`              | Runtime dependency analysis and standalone packaging |

<!-- web:start -->

The frontend lives in `apps/web`; shared React components live in `packages/ui`. Keep browser-safe shared code separate from `core`, which uses Node.js APIs.

<!-- web:end -->

Development commands run type checks and lint alongside the application. VS Code includes a **Server: Debug** launch configuration.

## Build and deploy

```sh
pnpm build:server
```

Workspace code is bundled into `apps/server/dist`. The directory includes runtime metadata, a pruned lockfile, source maps, and application assets when present. The build preserves the source lockfile and its resolved versions.

Use `pnpm start:server` to run the build locally. For deployment, copy the entire `dist` directory to the target and run inside it:

```sh
pnpm install --prod --frozen-lockfile
pnpm start
```

Only Node.js and pnpm are required on the target.

<!-- web:start -->

`pnpm build:web` produces static files in `apps/web/dist`. Serve them with a static web server and route `/api` to the backend. `pnpm start:web` provides a local preview.

<!-- web:end -->

## Configuration

- `PORT`: API port; defaults to `3000`.
- `DATA_DIR`: data directory; defaults to `.data/` at the repository root in development and `data/` inside the server distribution in production. Relative overrides resolve from the working directory.

<!-- web:start -->

- `WEB_PORT`: frontend port; defaults to `5173`. Set the same `PORT` for both development processes when changing the API port.

<!-- web:end -->

See the [server guide](apps/server/README.md) and [build documentation](scripts/README.md) for details (Chinese).

## Validation

```sh
pnpm exec turbo run build check-types lint
pnpm exec prettier --check .
pnpm --filter @repo/server test
pnpm --filter @repo/server test:e2e
node --test scripts/init.test.ts
```

CI runs these checks and verifies installation and startup of the standalone server distribution.

## License

[MIT](LICENSE) © lixinqiany
