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
3. **PROGRESS**: `> {name} progress: {done}/{total}` (only when progress increases)
4. **MIN_HIT**: `> {name} hit min focus: {min}m`

## Architecture

- **Client**: Pure JavaScript (ES modules), WebSocket client, Hybrid ASCII/HTML UI
- **Server**: Node.js + WebSocket (ws library)
- **State**: In-memory only (Map-based storage)
- **Sync**: Event-driven broadcasting
- **UI**: ASCII frame with HTML content overlay
- **Monorepo**: npm workspaces for client/server separation

## Project Structure

```
.
├── client/                    # Client application
│   ├── index.html             # Main HTML
│   ├── style.css              # Styles
│   ├── package.json           # Client dependencies
│   └── src/
│       ├── app.js             # Main application class
│       ├── state/             # State management
│       ├── events/            # Event handling
│       ├── renderer/          # UI rendering
│       ├── websocket/         # WebSocket connection
│       └── utils/             # Utility functions
├── server/                    # Server application
│   ├── package.json           # Server dependencies
│   └── src/
│       ├── index.js           # Server entry point
│       ├── room/              # Room state management
│       ├── events/            # Event handlers
│       ├── websocket/         # WebSocket server
│       └── utils/             # Utility functions
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

## Development

### Monorepo Structure

This project uses npm workspaces:
- `@aparty/client`: Client application (ES modules)
- `@aparty/server`: Server application (CommonJS)

### Running Both

You can run both client and server in separate terminals:

```bash
# Terminal 1: Server
npm run dev:server

# Terminal 2: Client
npm run dev:client
```

## License

MIT
