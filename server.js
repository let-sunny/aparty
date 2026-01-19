// Aparty v0.3 - WebSocket Server

const WebSocket = require('ws');
const http = require('http');

const room = {
  users: new Map(),
  clients: new Map()
};

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function broadcast(event) {
  const message = JSON.stringify(event);
  room.clients.forEach((ws, sessionId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function sendSnapshot(ws) {
  const users = Array.from(room.users.values());
  ws.send(JSON.stringify({
    type: 'ROOM_SNAPSHOT',
    payload: { users }
  }));
}

function checkMinFocusHit() {
  const now = Date.now();
  
  room.users.forEach((user, sessionId) => {
    if (user.minHitEmitted) return;
    
    const elapsedMs = now - user.joinedAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    if (elapsedMinutes >= user.minFocusMinutes) {
      user.minHitEmitted = true;
      
      broadcast({
        type: 'MIN_HIT',
        payload: {
          sessionId: user.sessionId,
          nickname: user.nickname,
          minFocusMinutes: user.minFocusMinutes
        }
      });
    }
  });
}

setInterval(checkMinFocusHit, 10000);

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let sessionId = null;
  
  ws.on('message', (message) => {
    try {
      const event = JSON.parse(message.toString());
      
      switch (event.type) {
        case 'JOIN':
          sessionId = generateSessionId();
          const now = Date.now();
          
          const user = {
            sessionId,
            nickname: event.payload.nickname,
            totalTodos: event.payload.totalTodos,
            doneCount: 0,
            minFocusMinutes: event.payload.minFocusMinutes,
            joinedAt: now,
            minHitEmitted: false
          };
          
          room.users.set(sessionId, user);
          room.clients.set(sessionId, ws);
          
          sendSnapshot(ws);
          
          broadcast({
            type: 'JOIN',
            payload: user
          });
          
          console.log(`[JOIN] ${user.nickname} (${sessionId})`);
          break;
          
        case 'LEAVE':
          if (event.payload.sessionId && room.users.has(event.payload.sessionId)) {
            const leavingUser = room.users.get(event.payload.sessionId);
            
            room.users.delete(event.payload.sessionId);
            room.clients.delete(event.payload.sessionId);
            
            broadcast({
              type: 'LEAVE',
              payload: {
                sessionId: leavingUser.sessionId,
                nickname: leavingUser.nickname
              }
            });
            
            console.log(`[LEAVE] ${leavingUser.nickname} (${event.payload.sessionId})`);
          }
          break;
          
        case 'PROGRESS':
          if (event.payload.sessionId && room.users.has(event.payload.sessionId)) {
            const user = room.users.get(event.payload.sessionId);
            
            if (event.payload.doneCount !== undefined) {
              const newDoneCount = Math.max(0, Math.min(user.totalTodos, event.payload.doneCount));
              user.doneCount = newDoneCount;
              
              broadcast({
                type: 'PROGRESS',
                payload: {
                  sessionId: user.sessionId,
                  nickname: user.nickname,
                  doneCount: user.doneCount,
                  totalTodos: user.totalTodos
                }
              });
              
              console.log(`[PROGRESS] ${user.nickname}: ${user.doneCount}/${user.totalTodos}`);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    if (sessionId && room.users.has(sessionId)) {
      const leavingUser = room.users.get(sessionId);
      
      room.users.delete(sessionId);
      room.clients.delete(sessionId);
      
      broadcast({
        type: 'LEAVE',
        payload: {
          sessionId: leavingUser.sessionId,
          nickname: leavingUser.nickname
        }
      });
      
      console.log(`[CLOSE] ${leavingUser.nickname} (${sessionId})`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Aparty server listening on ws://localhost:${PORT}`);
});
