# Aparty v0.3

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

### Start Server

```bash
npm start
```

Server will start on `ws://localhost:8080`

### Open Client

Open `index.html` in a web browser or serve it via a local server:

```bash
# Using Python
python3 -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000
```

Then open `http://localhost:3000` in your browser.

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

- **Client**: Pure JavaScript, WebSocket client, Hybrid ASCII/HTML UI
- **Server**: Node.js + WebSocket (ws library)
- **State**: In-memory only (Map-based storage)
- **Sync**: Event-driven broadcasting
- **UI**: ASCII frame with HTML content overlay

## Project Structure

```
.
├── index.html      # Main HTML (minimal, just terminal <pre>)
├── app.js          # Client-side logic and rendering
├── server.js       # WebSocket server
├── style.css       # Basic styling
├── package.json    # Dependencies
└── README.md       # This file
```

## Technical Notes

- Single room only (no room selection)
- Session-based: each connection = one session
- Refresh = new session (old session removed)
- Server restart = all state lost (by design)
- MIN_HIT events checked every 10 seconds server-side
- Todo text is private (only you can see your todos, others see progress count)
- Progress updates are broadcasted in real-time when todos are toggled

## License

MIT
