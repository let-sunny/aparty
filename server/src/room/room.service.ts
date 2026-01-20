import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';
import { User, Event, EVENT_TYPES } from '@aparty/shared';

@Injectable()
export class RoomService {
  private users = new Map<string, User>();
  private clients = new Map<string, WebSocket>();

  addUser(sessionId: string, user: User, ws: WebSocket): void {
    this.users.set(sessionId, user);
    this.clients.set(sessionId, ws);
  }

  removeUser(sessionId: string): void {
    this.users.delete(sessionId);
    this.clients.delete(sessionId);
  }

  getUser(sessionId: string): User | undefined {
    return this.users.get(sessionId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  hasUser(sessionId: string): boolean {
    return this.users.has(sessionId);
  }

  broadcast(event: Event): void {
    const message = JSON.stringify(event);
    this.clients.forEach((ws, sessionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  sendSnapshot(ws: WebSocket): void {
    const users = this.getAllUsers();
    ws.send(
      JSON.stringify({
        type: EVENT_TYPES.ROOM_SNAPSHOT,
        payload: { users },
      } as Event),
    );
  }
}
