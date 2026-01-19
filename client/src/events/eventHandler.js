export class EventHandler {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
  }

  handleEvent(event) {
    switch (event.type) {
      case 'ROOM_SNAPSHOT':
        this.handleRoomSnapshot(event.payload);
        break;

      case 'JOIN':
        this.handleJoin(event.payload);
        break;

      case 'LEAVE':
        this.handleLeave(event.payload);
        break;

      case 'PROGRESS':
        this.handleProgress(event.payload);
        break;

      case 'MIN_HIT':
        this.handleMinHit(event.payload);
        break;
    }

    this.renderer.render();
  }

  handleRoomSnapshot(payload) {
    this.state.users = payload.users;
    const me = this.state.users.find(u => u.nickname === this.state.me.nickname);
    if (me) {
      this.state.me.sessionId = me.sessionId;
      this.state.me.doneCount = me.doneCount;
      this.state.me.joinedAt = new Date(me.joinedAt);
    }
  }

  handleJoin(newUser) {
    if (!this.state.users.find(u => u.sessionId === newUser.sessionId)) {
      this.state.users.push(newUser);
    }
    if (newUser.nickname === this.state.me.nickname) {
      this.state.me.sessionId = newUser.sessionId;
      this.state.me.doneCount = newUser.doneCount;
      this.state.me.joinedAt = new Date(newUser.joinedAt);
      if (this.state.myTodos.length !== newUser.totalTodos) {
        this.state.myTodos = [];
        for (let i = 1; i <= newUser.totalTodos; i++) {
          this.state.myTodos.push({ text: `todo ${i}`, done: false });
        }
      }
    }
    this.addFeed(`> ${newUser.nickname} joined (min ${newUser.minFocusMinutes}m, ${newUser.totalTodos} todos)`);
  }

  handleLeave(payload) {
    const leftSessionId = payload.sessionId;
    this.state.users = this.state.users.filter(u => u.sessionId !== leftSessionId);
    this.addFeed(`> ${payload.nickname} left`);
    if (leftSessionId === this.state.me.sessionId) {
      this.state.me.sessionId = null;
      this.state.me.doneCount = 0;
      this.state.me.joinedAt = null;
    }
  }

  handleProgress(payload) {
    const progressUser = this.state.users.find(u => u.sessionId === payload.sessionId);
    if (progressUser) {
      progressUser.doneCount = payload.doneCount;
    }
    const nickname = payload.nickname || (progressUser ? progressUser.nickname : 'unknown');
    const doneCount = payload.doneCount;
    const totalTodos = payload.totalTodos || (progressUser ? progressUser.totalTodos : 0);
    this.addFeed(`> ${nickname} progress: ${doneCount}/${totalTodos}`);
    if (payload.sessionId === this.state.me.sessionId) {
      this.state.me.doneCount = payload.doneCount;
    }
  }

  handleMinHit(payload) {
    const hitUser = this.state.users.find(u => u.sessionId === payload.sessionId);
    if (hitUser) {
      hitUser.minHitEmitted = true;
    }
    this.addFeed(`> ${payload.nickname} hit min focus: ${payload.minFocusMinutes}m`);
  }

  addFeed(line) {
    this.state.feed.push(line);
    if (this.state.feed.length > 200) {
      this.state.feed.splice(0, this.state.feed.length - 200);
    }
  }
}
