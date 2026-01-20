// Event type constants
export const EVENT_TYPES = {
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  PROGRESS: 'PROGRESS',
  MIN_HIT: 'MIN_HIT',
  ROOM_SNAPSHOT: 'ROOM_SNAPSHOT',
} as const;

// Event type union
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Event payload interface
export interface EventPayload {
  sessionId?: string;
  nickname?: string;
  totalTodos?: number;
  doneCount?: number;
  minFocusMinutes?: number;
  users?: User[];
}

// Base User interface (server-side)
export interface User {
  sessionId: string;
  nickname: string;
  totalTodos: number;
  doneCount: number;
  minFocusMinutes: number;
  joinedAt: number;
  minHitEmitted?: boolean;
  lastElapsedMinute?: number;
}

// Event interface
export interface Event {
  type: EventType;
  payload: EventPayload | User | { users: User[] };
}
