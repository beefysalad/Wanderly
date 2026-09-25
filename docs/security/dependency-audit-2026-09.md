# Dependency audit triage (2026-09-25)

Source: `npm audit --omit=dev` on `dev` after the security pass work: **31 vulnerabilities (4 critical, 15 high, 11 moderate, 1 low)**. `npm ls` was used to find which top-level package pulls each one in, and the code was checked for whether the vulnerable feature is used.

## Fix now (reachable at runtime, non-breaking upgrade available)

| Package | Severity | Where it runs | Notes |
|---|---|---|---|
| `next` 15.5.9 (direct) | critical | Server: every request | Self-hosted DoS and request-deserialization advisories. `npm audit` offers 15.5.26 (same major, non-breaking). Also fixes the `postcss` (XSS in `</style>`) and `sharp` (libvips CVEs, used by `next/image`) advisories that Next pins. |
| `axios` (direct) | high | Server and browser (`lib/axios.ts`) | NO_PROXY bypass and prototype-pollution auth bypass; patched in a non-breaking release. |
| `form-data` | high | Via `axios` (browser and server uploads) | CRLF injection; fixed by the same `npm audit fix`. |

**Action (maintainer, since `CLAUDE.md` forbids me running installs):** `npm audit fix`, review the lockfile diff, then run lint, tests and `npm run build:ci`. Do **not** use `--force`.

## Low practical risk (transitive, feature not used)

| Package | Severity | Pulled in by | Why it is low risk here |
|---|---|---|---|
| `protobufjs`, `@grpc/grpc-js`, `google-gax` | critical/high | `firebase-admin` (Firestore client) and `firebase` (client Firestore) | The app never uses Firestore, so these code paths are never executed. Non-breaking updates exist and will arrive with `npm audit fix`. |
| `websocket-driver`, `faye-websocket` | critical | `firebase` -> `@firebase/database` | Realtime Database is not used. |
| `fast-xml-parser` | critical | `firebase-admin` -> `@google-cloud/storage` | Cloud Storage is not used (uploads go to Cloudinary). |
| `node-forge`, `jws` | high | `firebase-admin` (service-account and cert handling) | Used to sign/verify Google tokens (RS256); the `jws` HMAC issue concerns HS256 verification, which the app does not use. Updates arrive with `npm audit fix`. |
| `lodash` | high | `cloudinary` | The advisory needs attacker-controlled `_.template` input; the app passes none. |
| `socket.io-parser`, `ws` (via `engine.io-client`) | high | `socket.io-client` | Browser side: the browser uses native WebSocket, and parser issues require a malicious server. Realistic exposure is the separate socket server, which is out of this repo. A newer `socket.io-client` is worth taking with `npm audit fix`. |
| `defu` | high | `prisma` CLI (`@prisma/config` -> `c12`) | Build-time tooling only. |

## Needs a breaking change or an upstream release

| Package | Severity | Notes |
|---|---|---|
| `prisma` / `@prisma/config` / `deepmerge-ts` / `effect` | high | Build-time Prisma CLI dependencies. `npm audit` suggests "fixing" it by downgrading `prisma` to 6.12.0, which is a regression, not a fix; wait for a patched Prisma 6.x release. Not reachable at runtime (the CLI runs during build and migrations only). |

## Remaining risk after `npm audit fix`

- The Prisma CLI advisories above (build-time only).
- The external Socket.IO server is not covered by this repo's audit.
- Re-run `npm audit --omit=dev` after the fix and update this file with the new counts.

## Result after `npm audit fix` (maintainer ran it)

`npm audit --omit=dev` went from **31 to 14 vulnerabilities** (0 low, 8 moderate, 5 high, 1 critical). `axios`, `form-data`, `fast-xml-parser`, `protobufjs`, `@grpc/grpc-js`, `websocket-driver`, `node-forge`, `jws`, `lodash`, `defu`, `ws` and `socket.io-parser` are resolved.

Still open:

| Package | Severity | Why | Action |
|---|---|---|---|
| `next` | critical | `package.json` pins `next` to the exact version `15.5.9`, so `npm audit fix` cannot move it. The fix (15.5.26) is a patch release in the same minor. | Run `npm i next@15.5.26` (and `npm i -D eslint-config-next@15.5.26` to keep them in step). This also clears the `postcss` and `sharp` highs, which Next pins. |
| `prisma`, `@prisma/config`, `deepmerge-ts` | high | Build-time CLI only; npm's suggested "fix" is a downgrade to prisma 6.12.0. | Wait for a patched Prisma 6.x. |
| `firebase-admin` and its `@google-cloud/*`, `gaxios`, `google-gax`, `retry-request`, `teeny-request`, `uuid` | moderate | Firestore/Storage code paths the app does not use. | Take the next `firebase-admin` release. |
