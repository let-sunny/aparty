# Aparty

A silent focus room - real-time presence sharing without chat.

## Features

- **No Chat**: No messages, reactions, or distractions
- **Presence Only**: See who's focusing and their progress
- **Todo Progress**: Share your todo completion (done/total)
- **Focus Timer**: Track minimum focus time (25/50/90/120 minutes)
- **ASCII Terminal UI**: Retro terminal-style interface
- **Real-time Sync**: WebSocket-based instant synchronization
- **In-memory**: No database, session-based (volatile)

## Quick Start

### Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (client and server).

### Start Server

```bash
npm run start:server
# or
npm run dev:server
```

Server will start on `ws://localhost:8080`

### Start Client

```bash
npm run dev:client
```

This will serve the client on a local server. Alternatively, you can open `client/index.html` directly in a browser or use any static file server.

## Usage

1. **Join**: Enter nickname, select min focus time (25/50/90/120 minutes), and enter todo text (up to 4 lines)
2. **Focus**: See others' progress and focus status in real-time
3. **Progress**: Press `1-4` keys to toggle todos as done/undone
4. **Leave**: Press `L` key to leave the room

## Keyboard Shortcuts

- `J` - Join the room (or submit join form)
- `1-4` - Toggle todo 1-4 as done/undone
- `L` - Leave the room

## Event Feed

The feed shows 4 types of events:

1. **JOIN**: `> {name} joined (min {min}m, {total} todos)`
2. **LEAVE**: `> {name} left`
3. **PROGRESS**: `> {name} progress: {done}/{total}` (includes your own progress)
4. **MIN_HIT**: `> {name} hit min focus: {min}m`

## Architecture

- **Client**: TypeScript + React + Vite, WebSocket client (purrcat), Cross-tab sync (purrtabby), Hybrid ASCII/HTML UI
- **Server**: TypeScript + NestJS, WebSocket server (ws library)
- **Shared**: Common types and constants package (dual package: ESM + CommonJS)
- **State**: In-memory only (Map-based storage)
- **Sync**: Event-driven broadcasting with automatic reconnection
- **UI**: ASCII frame with HTML content overlay, React ErrorBoundary
- **Monorepo**: npm workspaces for client/server/shared separation

## Project Structure

```
.
├── client/                    # Client application (TypeScript + React)
│   ├── index.html             # Main HTML
│   ├── style.css              # Styles
│   ├── package.json           # Client dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript config
│   └── src/
│       ├── main.tsx           # React entry point
│       ├── components/        # React components
│       │   ├── App.tsx        # Main app component
│       │   ├── ErrorBoundary.tsx  # Error boundary
│       │   ├── JoinModal.tsx  # Join modal
│       │   └── TerminalFrame.tsx  # Terminal UI
│       ├── hooks/             # React hooks
│       │   ├── useAppState.ts # State management
│       │   └── useWebSocket.ts  # WebSocket hook (purrcat)
│       ├── types/             # TypeScript types
│       └── utils/             # Utility functions
├── server/                    # Server application (TypeScript + NestJS)
│   ├── package.json           # Server dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── src/
│       ├── main.ts            # Server entry point
│       ├── app.module.ts      # NestJS root module
│       ├── room/              # Room state management
│       │   └── room.service.ts
│       ├── events/            # Event handlers
│       │   ├── event-handler.service.ts
│       │   └── min-focus-checker.service.ts
│       ├── websocket/         # WebSocket server
│       │   └── websocket.gateway.ts
│       └── utils/             # Utility functions
├── shared/                    # Shared package (types & constants)
│   ├── package.json           # Shared dependencies
│   ├── tsconfig.json          # Base TypeScript config
│   ├── tsconfig.esm.json      # ESM build config
│   ├── tsconfig.cjs.json      # CommonJS build config
│   └── src/
│       ├── events.ts          # Event types & constants
│       └── index.ts           # Main export
├── package.json               # Root workspace config
└── README.md                  # This file
```

## Technical Notes

- Single room only (no room selection)
- Session-based: each connection = one session
- Refresh = new session (old session removed)
- Server restart = all state lost (by design)
- MIN_HIT events checked every 10 seconds server-side
- Todo text is private (only you can see your todos, others see progress count)
- Progress updates are broadcasted in real-time when todos are toggled
- Cross-tab synchronization via purrtabby (BroadcastChannel)
- Automatic WebSocket reconnection with exponential backoff (purrcat)
- Type-safe event communication via shared package

## Development

### Monorepo Structure

This project uses npm workspaces:
- `@aparty/client`: Client application (TypeScript + React, ES modules)
- `@aparty/server`: Server application (TypeScript + NestJS, CommonJS)
- `@aparty/shared`: Shared types and constants (dual package: ESM + CommonJS)

### Building Shared Package

The shared package needs to be built before use:

```bash
cd shared
npm run build
```

This generates both ESM (`dist/*.js`) and CommonJS (`dist/*.cjs`) builds.

### Running Both

You can run both client and server in separate terminals:

```bash
# Terminal 1: Server
npm run dev:server

# Terminal 2: Client
npm run dev:client
```

## TODO

### Add Test Coverage
- [ ] Client component tests (React Testing Library)
- [ ] Hook tests (useAppState, useWebSocket)
- [ ] Utility function tests (formatClock, userMode, frameRenderer)
- [ ] Server service tests (NestJS Testing Module)
- [ ] WebSocket integration tests
- [ ] E2E tests (Playwright or Cypress)

**Recommended Testing Tools:**
- Client: Vitest + React Testing Library
- Server: Jest (NestJS default)
- E2E: Playwright

### Integrate Lighthouse CI

**Feasibility:** ✅ Feasible

**Implementation Approach:**
1. Create GitHub Actions workflow (`.github/workflows/lighthouse.yml`)
2. Host built client as static files (e.g., GitHub Pages, Netlify)
3. Run Lighthouse CI to measure performance/accessibility/SEO scores
4. Automatically comment results on PRs

**Considerations:**
- Client is static files, making it suitable for Lighthouse CI
- WebSocket connections are difficult for Lighthouse to test directly (manual testing required)
- ASCII terminal UI may score low on accessibility (by design)

**Recommended Configuration:**
```yaml
# Example .github/workflows/lighthouse.yml
- Run Lighthouse CI on every PR
- Set thresholds for performance, accessibility, SEO scores
- Automatically add results as PR comments
```

### Integrate Sentry

**Implementation Locations:**
1. **Client** (`client/src/main.tsx`):
   - Initialize Sentry (global error catching)
   - Call `Sentry.captureException()` in ErrorBoundary
   - Add breadcrumbs for WebSocket errors
   - Set user context (sessionId, nickname)

2. **Server** (`server/src/main.ts`):
   - Initialize Sentry (global error catching)
   - Create NestJS Exception Filter
   - Integrate Sentry in WebSocket error handlers

**Breadcrumb Addition Points:**
- When receiving WebSocket events (JOIN, LEAVE, PROGRESS)
- On user actions (todo toggle, keyboard input)
- On connection state changes

**Environment Variables:**
- Client: `VITE_SENTRY_DSN`
- Server: `SENTRY_DSN`

## License

MIT
