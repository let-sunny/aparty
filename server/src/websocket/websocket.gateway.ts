import { Injectable } from '@nestjs/common';
import { Server, WebSocket as WS } from 'ws';
import { EventHandlerService } from '../events/event-handler.service';
import { Event, EVENT_TYPES } from '@aparty/shared';

@Injectable()
export class WebSocketGateway {
  private wss: Server;
  private sessionMap = new Map<WS, string>();

  constructor(private readonly eventHandlerService: EventHandlerService) {}

  createServer(port: number = 8080): void {
    const http = require('http');
    const server = http.createServer();
    
    this.wss = new Server({ server });

    this.wss.on('connection', (ws: WS) => {
      this.handleConnection(ws);
    });

    server.listen(port, () => {
      console.log(`Aparty server listening on ws://localhost:${port}`);
    });
  }

  handleConnection(ws: WS): void {
    let sessionId: string | null = null;

    ws.on('message', (message: Buffer) => {
      try {
        const event: Event = JSON.parse(message.toString());

        switch (event.type) {
          case EVENT_TYPES.JOIN:
            sessionId = this.eventHandlerService.handleJoin(event, ws);
            if (sessionId) {
              this.sessionMap.set(ws, sessionId);
            }
            break;

          case EVENT_TYPES.LEAVE:
            this.eventHandlerService.handleLeave(event);
            break;

          case EVENT_TYPES.PROGRESS:
            this.eventHandlerService.handleProgress(event);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (sessionId) {
        this.eventHandlerService.handleConnectionClose(sessionId);
        this.sessionMap.delete(ws);
      }
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  handleDisconnect(ws: WS): void {
    const sessionId = this.sessionMap.get(ws);
    if (sessionId) {
      this.eventHandlerService.handleConnectionClose(sessionId);
      this.sessionMap.delete(ws);
    }
  }
}
