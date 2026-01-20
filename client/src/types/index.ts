import { User, EventType, Event, EventPayload, EVENT_TYPES } from '@aparty/shared';

// Re-export shared types
export type { User, EventType, Event, EventPayload };
export { EVENT_TYPES };

export interface Todo {
  text: string;
  done: boolean;
}

export interface Me {
  sessionId: string | null;
  nickname: string | null;
  totalTodos: number;
  doneCount: number;
  minFocusMinutes: number;
  joinedAt: number | null;
}

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'error';
  ws: WebSocket | null;
}

export interface AppState {
  sessionStartedAt: number;
  users: User[];
  feed: string[];
  me: Me;
  myTodos: Todo[];
  connection: ConnectionState;
}


export interface UserMode {
  mode: 'FOCUS' | 'EXTRA';
  elapsed: number;
  overtime: number;
}
