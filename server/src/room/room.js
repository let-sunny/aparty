const WebSocket = require('ws');

class Room {
  constructor() {
    this.users = new Map();
    this.clients = new Map();
  }

  addUser(sessionId, user, ws) {
    this.users.set(sessionId, user);
    this.clients.set(sessionId, ws);
  }

  removeUser(sessionId) {
    this.users.delete(sessionId);
    this.clients.delete(sessionId);
  }

  getUser(sessionId) {
    return this.users.get(sessionId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  broadcast(event) {
    const message = JSON.stringify(event);
    this.clients.forEach((ws, sessionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  sendSnapshot(ws) {
    const users = this.getAllUsers();
    ws.send(JSON.stringify({
      type: 'ROOM_SNAPSHOT',
      payload: { users }
    }));
  }
}

module.exports = Room;
