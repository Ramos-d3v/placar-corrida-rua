# Frontend Realtime Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the deployed React placar to the backend Socket.IO realtime stream while preserving the existing REST loading and filtering behavior.

**Architecture:** Keep REST as the authoritative data source and add a focused realtime adapter in `src/services/resultsRealtime.js`. The adapter owns Socket.IO connection/subscription lifecycle and emits refresh notifications; `App.jsx` consumes those notifications only while showing the results list. Environment values select the direct Render/local Socket.IO origin without changing the existing REST proxy.

**Tech Stack:** React 19, Vite, Socket.IO client, Node test runner, ESLint, Vite build.

---

## Chunk 1: Realtime adapter and dependency

### Task 1: Add Socket.IO dependency and test command

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add `socket.io-client` to runtime dependencies and add a `test` script using `node --test`.**
- [ ] **Step 2: Run `npm install` to update the lockfile.**
- [ ] **Step 3: Run `npm test` and verify the runner reports no test files or passes once the adapter test exists.**
- [ ] **Step 4: Commit the dependency-only change with `feat: add socket.io client dependency`.**

### Task 2: Implement the Socket.IO results adapter

**Files:**
- Create: `src/services/resultsRealtime.js`
- Create: `src/services/resultsRealtime.test.js`

- [ ] **Step 1: Write tests with a fake Socket.IO-compatible object for the following behaviors:**
  - `connect` emits `subscribe` with `{ event_slug: 'corrida-demonstracao-mvp' }`.
  - A positive subscription acknowledgment leaves the subscription active.
  - A negative, malformed, or missing acknowledgment calls the error callback without throwing.
  - `results.updated` and `results.reset` invoke the refresh callback.
  - `results.pending` does not erase or fabricate result data.
  - `connect_error`/`disconnect` report an error but do not throw.
  - cleanup removes listeners and disconnects exactly once.
  - repeated refresh notifications are coalesced until the consumer is ready again.
- [ ] **Step 2: Run the focused test file with `npm test -- src/services/resultsRealtime.test.js` and verify it fails before implementation.**
- [ ] **Step 3: Implement a small adapter with an injectable socket-like object for tests and a production factory that calls `io(url, { transports: ['websocket'] })`.**
- [ ] **Step 4: Make the adapter use the default Socket.IO namespace/path, subscribe after every `connect`, accept only documented positive acknowledgment shapes, and surface invalid responses through the error callback.**
- [ ] **Step 5: Keep event payloads opaque; event listeners only request REST refreshes, while malformed payloads are reported and do not mutate application data.**
- [ ] **Step 6: Implement cleanup that removes every registered listener and closes the socket, preventing duplicate listeners after remount/reconnect.**
- [ ] **Step 7: Run `npm test -- src/services/resultsRealtime.test.js` and verify all adapter tests pass.**
- [ ] **Step 8: Commit the adapter and tests with `feat: add results realtime adapter`.**

## Chunk 2: Integrate realtime into the results screen

### Task 3: Wire the adapter into `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/services/resultsApi.js`

- [ ] **Step 1: Add explicit realtime configuration exports for `VITE_REALTIME_URL` and `VITE_EVENT_SLUG`, with the documented fallback URL/event slug and invalid-URL handling.**
- [ ] **Step 2: Add a list-screen-only effect in `App.jsx` that starts the realtime adapter when `bibNumber` is empty and cleans it up when the participant detail opens or the component unmounts.**
- [ ] **Step 3: Connect refresh notifications to the existing REST loading path, preserving the current page, gender, category, and search values.**
- [ ] **Step 4: Ensure an in-flight REST request is aborted or ignored when a newer refresh starts, and queue at most one refresh notification while a request is already in progress.**
- [ ] **Step 5: Keep realtime errors non-destructive: retain valid list data, do not convert connection failure into an empty state, and continue showing the existing REST error state if the HTTP refresh fails.**
- [ ] **Step 6: Run the focused tests and `npm run lint`; fix any hook dependency or unused-variable errors without changing unrelated UI behavior.**
- [ ] **Step 7: Run `npm run build` and verify the production bundle builds with the new client import.**
- [ ] **Step 8: Commit the integration with `feat: refresh results from realtime events`.**

## Chunk 3: Environment, deployment documentation, and final verification

### Task 4: Document local and production realtime configuration

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Document `VITE_REALTIME_URL=http://localhost:3001` and `VITE_EVENT_SLUG=corrida-demonstracao-mvp` for local development.**
- [ ] **Step 2: Document the Vercel values `VITE_REALTIME_URL=https://placar-corrida-rua-backend.onrender.com` and the same event slug.**
- [ ] **Step 3: Explain that REST remains on the existing `/api` proxy/rewrite while Socket.IO connects directly to the backend, and that backend CORS must allow `https://cronoracingrua.vercel.app`.**
- [ ] **Step 4: Document that missing/invalid realtime configuration disables realtime only; REST remains usable.**
- [ ] **Step 5: Run `npm test`, `npm run lint`, and `npm run build` together as the final validation.**
- [ ] **Step 6: Inspect `git diff` and `git status --short` to verify only the intended dependency, source, test, environment, README, and plan/spec files changed.**
- [ ] **Step 7: Commit the documentation and final verification updates with `docs: document realtime deployment configuration`.**

### Acceptance checks

- [ ] The production browser connects to `https://placar-corrida-rua-backend.onrender.com` through Socket.IO, not a native `WebSocket`.
- [ ] The client emits `subscribe` with `event_slug: 'corrida-demonstracao-mvp'` after each successful connection.
- [ ] `results.updated` and `results.reset` refresh the current REST query without losing filters or pagination.
- [ ] Reconnects do not duplicate listeners or create unbounded concurrent requests.
- [ ] REST results remain usable when the realtime server is unavailable.
- [ ] `npm test`, `npm run lint`, and `npm run build` pass.
