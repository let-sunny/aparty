const { generateSessionId } = require('../utils/sessionId');

class EventHandler {
  constructor(room) {
    this.room = room;
  }

  handleJoin(event, ws) {
    const sessionId = generateSessionId();
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
    
    this.room.addUser(sessionId, user, ws);
    this.room.sendSnapshot(ws);
    
    this.room.broadcast({
      type: 'JOIN',
      payload: user
    });
    
    console.log(`[JOIN] ${user.nickname} (${sessionId})`);
    return sessionId;
  }

  handleLeave(event) {
    const sessionId = event.payload.sessionId;
    if (!sessionId || !this.room.users.has(sessionId)) {
      return;
    }

    const leavingUser = this.room.getUser(sessionId);
    
    this.room.removeUser(sessionId);
    
    this.room.broadcast({
      type: 'LEAVE',
      payload: {
        sessionId: leavingUser.sessionId,
        nickname: leavingUser.nickname
      }
    });
    
    console.log(`[LEAVE] ${leavingUser.nickname} (${sessionId})`);
  }

  handleProgress(event) {
    const sessionId = event.payload.sessionId;
    if (!sessionId || !this.room.users.has(sessionId)) {
      return;
    }

    const user = this.room.getUser(sessionId);
    
    if (event.payload.doneCount !== undefined) {
      const newDoneCount = Math.max(0, Math.min(user.totalTodos, event.payload.doneCount));
      user.doneCount = newDoneCount;
      
      this.room.broadcast({
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

  handleConnectionClose(sessionId) {
    if (!sessionId || !this.room.users.has(sessionId)) {
      return;
    }

    const leavingUser = this.room.getUser(sessionId);
    
    this.room.removeUser(sessionId);
    
    this.room.broadcast({
      type: 'LEAVE',
      payload: {
        sessionId: leavingUser.sessionId,
        nickname: leavingUser.nickname
      }
    });
    
    console.log(`[CLOSE] ${leavingUser.nickname} (${sessionId})`);
  }
}

module.exports = EventHandler;
