import { Module } from '@nestjs/common';
import { RoomService } from './room/room.service';
import { EventHandlerService } from './events/event-handler.service';
import { MinFocusCheckerService } from './events/min-focus-checker.service';
import { WebSocketGateway } from './websocket/websocket.gateway';

@Module({
  providers: [
    RoomService,
    EventHandlerService,
    MinFocusCheckerService,
    WebSocketGateway,
  ],
})
export class AppModule {}
