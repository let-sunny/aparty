class MinFocusChecker {
  constructor(room) {
    this.room = room;
    this.intervalId = null;
  }

  start(intervalMs = 10000) {
    this.intervalId = setInterval(() => {
      this.checkMinFocusHit();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkMinFocusHit() {
    const now = Date.now();
    const WebSocket = require('ws');
    
    this.room.users.forEach((user, sessionId) => {
      if (user.minHitEmitted) return;
      
      const elapsedMs = now - user.joinedAt;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      
      if (elapsedMinutes >= user.minFocusMinutes) {
        user.minHitEmitted = true;
        
        this.room.broadcast({
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
}

module.exports = MinFocusChecker;
