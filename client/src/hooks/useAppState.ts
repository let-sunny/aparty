import { useState, useCallback } from 'react';
import { AppState, User, Todo, Event, EVENT_TYPES } from '../types';

export function createInitialState(): AppState {
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

export function useAppState() {
  const [state, setState] = useState<AppState>(createInitialState);

  const handleEvent = useCallback((event: Event) => {
    setState(prevState => {
      const newState = { ...prevState };
      const feedBefore = newState.feed.length;
      
      switch (event.type) {
        case EVENT_TYPES.ROOM_SNAPSHOT:
          const payload = event.payload as { users: User[] };
          newState.users = payload.users;
          const me = newState.users.find(u => u.nickname === newState.me.nickname);
          if (me) {
            newState.me.sessionId = me.sessionId;
            newState.me.doneCount = me.doneCount;
            newState.me.joinedAt = me.joinedAt;
          }
          break;

        case EVENT_TYPES.JOIN:
          const newUser = event.payload as User;
          if (!newState.users.find(u => u.sessionId === newUser.sessionId)) {
            newState.users = [...newState.users, newUser];
          }
          // 내가 보낸 JOIN 요청에 대한 응답인지 확인 (nickname 또는 sessionId로)
          if (newUser.nickname === newState.me.nickname || newState.me.sessionId === null) {
            newState.me.sessionId = newUser.sessionId;
            newState.me.nickname = newUser.nickname;
            newState.me.doneCount = newUser.doneCount;
            newState.me.joinedAt = newUser.joinedAt;
            if (newState.myTodos.length !== newUser.totalTodos) {
              newState.myTodos = [];
              for (let i = 1; i <= newUser.totalTodos; i++) {
                newState.myTodos.push({ text: `todo ${i}`, done: false });
              }
            }
          }
          const feedMessage = `> ${newUser.nickname} joined (min ${newUser.minFocusMinutes}m, ${newUser.totalTodos} todos)`;
          newState.feed = [...newState.feed, feedMessage];
          if (newState.feed.length > 200) {
            newState.feed = newState.feed.slice(-200);
          }
          break;

        case EVENT_TYPES.LEAVE:
          const leavePayload = event.payload as { sessionId: string; nickname: string };
          newState.users = newState.users.filter(u => u.sessionId !== leavePayload.sessionId);
          newState.feed = [...newState.feed, `> ${leavePayload.nickname} left`];
          if (leavePayload.sessionId === newState.me.sessionId) {
            newState.me.sessionId = null;
            newState.me.doneCount = 0;
            newState.me.joinedAt = null;
          }
          break;

        case EVENT_TYPES.PROGRESS:
          const progressPayload = event.payload as { sessionId: string; nickname?: string; doneCount: number; totalTodos?: number };
          const progressUser = newState.users.find(u => u.sessionId === progressPayload.sessionId);
          if (progressUser) {
            progressUser.doneCount = progressPayload.doneCount;
            newState.users = [...newState.users];
          }
          const nickname = progressPayload.nickname || (progressUser ? progressUser.nickname : 'unknown');
          const doneCount = progressPayload.doneCount;
          const totalTodos = progressPayload.totalTodos || (progressUser ? progressUser.totalTodos : 0);
          
          // 모든 progress를 피드에 추가
          newState.feed = [...newState.feed, `> ${nickname} progress: ${doneCount}/${totalTodos}`];
          if (newState.feed.length > 200) {
            newState.feed = newState.feed.slice(-200);
          }
          
          if (progressPayload.sessionId === newState.me.sessionId) {
            newState.me.doneCount = progressPayload.doneCount;
            // 내 todos도 업데이트
            const myUser = newState.users.find(u => u.sessionId === newState.me.sessionId);
            if (myUser) {
              // doneCount에 맞춰서 todos 업데이트 (간단한 방법: 처음 N개를 done으로)
              const newTodos = [...newState.myTodos];
              for (let i = 0; i < newTodos.length; i++) {
                newTodos[i].done = i < doneCount;
              }
              newState.myTodos = newTodos;
            }
          }
          break;

        case EVENT_TYPES.MIN_HIT:
          const minHitPayload = event.payload as { sessionId: string; nickname: string; minFocusMinutes: number };
          const hitUser = newState.users.find(u => u.sessionId === minHitPayload.sessionId);
          if (hitUser) {
            hitUser.minHitEmitted = true;
            newState.users = [...newState.users];
          }
          newState.feed = [...newState.feed, `> ${minHitPayload.nickname} hit min focus: ${minHitPayload.minFocusMinutes}m`];
          if (newState.feed.length > 200) {
            newState.feed = newState.feed.slice(-200);
          }
          break;
      }
      
      return newState;
    });
  }, []);

  const updateConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'error', ws: WebSocket | null) => {
    setState(prevState => ({
      ...prevState,
      connection: { status, ws }
    }));
  }, []);

  const setMe = useCallback((me: Partial<AppState['me']>) => {
    setState(prevState => ({
      ...prevState,
      me: { ...prevState.me, ...me }
    }));
  }, []);

  const setMyTodos = useCallback((todos: Todo[]) => {
    setState(prevState => ({
      ...prevState,
      myTodos: todos
    }));
  }, []);

  const toggleTodo = useCallback((index: number) => {
    setState(prevState => {
      const newTodos = [...prevState.myTodos];
      if (index >= 0 && index < newTodos.length) {
        newTodos[index].done = !newTodos[index].done;
        const newDoneCount = newTodos.filter(t => t.done).length;
        return {
          ...prevState,
          myTodos: newTodos,
          me: { ...prevState.me, doneCount: newDoneCount }
        };
      }
      return prevState;
    });
  }, []);

  const resetOnLeave = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      sessionStartedAt: Date.now(),
      users: [],
      feed: [],
      me: {
        ...prevState.me,
        sessionId: null,
        doneCount: 0,
        joinedAt: null
      },
      myTodos: [],
      connection: {
        status: 'disconnected',
        ws: null
      }
    }));
  }, []);

  const setSessionStartedAt = useCallback((timestamp: number) => {
    setState(prevState => ({
      ...prevState,
      sessionStartedAt: timestamp
    }));
  }, []);

  return {
    state,
    handleEvent,
    updateConnectionStatus,
    setMe,
    setMyTodos,
    toggleTodo,
    resetOnLeave,
    setSessionStartedAt
  };
}
