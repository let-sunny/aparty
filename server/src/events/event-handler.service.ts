import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';
import { RoomService } from '../room/room.service';
import { generateSessionId } from '../utils/sessionId';
import { Event, User, EVENT_TYPES } from '@aparty/shared';

@Injectable()
export class EventHandlerService {
  constructor(private readonly roomService: RoomService) {}

  handleJoin(event: Event, ws: WebSocket): string {
    const payload = event.payload as { nickname: string; totalTodos: number; minFocusMinutes: number };
    const sessionId = generateSessionId();
    const now = Date.now();

    const user: User = {
      sessionId,
      nickname: payload.nickname,
      totalTodos: payload.totalTodos,
      doneCount: 0,
      minFocusMinutes: payload.minFocusMinutes,
      joinedAt: now,
      minHitEmitted: false,
    };

    this.roomService.addUser(sessionId, user, ws);
    this.roomService.sendSnapshot(ws);

    this.roomService.broadcast({
      type: EVENT_TYPES.JOIN,
      payload: user,
    });

    console.log(`[JOIN] ${user.nickname} (${sessionId})`);
    return sessionId;
  }

  handleLeave(event: Event): void {
    const payload = event.payload as { sessionId: string };
    const sessionId = payload.sessionId;
    
    if (!sessionId || !this.roomService.hasUser(sessionId)) {
      return;
    }

    const leavingUser = this.roomService.getUser(sessionId);
    if (!leavingUser) {
      return;
    }

    this.roomService.removeUser(sessionId);

    this.roomService.broadcast({
      type: EVENT_TYPES.LEAVE,
      payload: {
        sessionId: leavingUser.sessionId,
        nickname: leavingUser.nickname,
      },
    });

    console.log(`[LEAVE] ${leavingUser.nickname} (${sessionId})`);
  }

  handleProgress(event: Event): void {
    const payload = event.payload as { sessionId: string; doneCount?: number };
    const sessionId = payload.sessionId;
    
    if (!sessionId || !this.roomService.hasUser(sessionId)) {
      return;
    }

    const user = this.roomService.getUser(sessionId);
    if (!user) {
      return;
    }

    if (payload.doneCount !== undefined) {
      const newDoneCount = Math.max(0, Math.min(user.totalTodos, payload.doneCount));
      user.doneCount = newDoneCount;

      this.roomService.broadcast({
        type: EVENT_TYPES.PROGRESS,
        payload: {
          sessionId: user.sessionId,
          nickname: user.nickname,
          doneCount: user.doneCount,
          totalTodos: user.totalTodos,
        },
      });

      console.log(`[PROGRESS] ${user.nickname}: ${user.doneCount}/${user.totalTodos}`);
    }
  }

  handleConnectionClose(sessionId: string): void {
    if (!sessionId || !this.roomService.hasUser(sessionId)) {
      return;
    }

    const leavingUser = this.roomService.getUser(sessionId);
    if (!leavingUser) {
      return;
    }

    this.roomService.removeUser(sessionId);

    this.roomService.broadcast({
      type: EVENT_TYPES.LEAVE,
      payload: {
        sessionId: leavingUser.sessionId,
        nickname: leavingUser.nickname,
      },
    });

    console.log(`[CLOSE] ${leavingUser.nickname} (${sessionId})`);
  }
}
