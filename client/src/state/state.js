export function createInitialState() {
  return {
    sessionStartedAt: Date.now(),
    users: [],
    feed: [],
    me: {
      sessionId: null,
      nickname: null,
      totalTodos: 0,
      doneCount: 0,
      minFocusMinutes: 50,
      joinedAt: null
    },
    myTodos: [],
    connection: {
      status: 'disconnected',
      ws: null
    }
  };
}
