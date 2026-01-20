import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RoomService } from '../room/room.service';

@Injectable()
export class MinFocusCheckerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly roomService: RoomService) {}

  onModuleInit() {
    this.start(10000);
  }

  onModuleDestroy() {
    this.stop();
  }

  start(intervalMs = 10000): void {
    this.intervalId = setInterval(() => {
      this.checkMinFocusHit();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkMinFocusHit(): void {
    const now = Date.now();
    const users = this.roomService.getAllUsers();

    users.forEach((user) => {
      if (user.minHitEmitted) return;

      const elapsedMs = now - user.joinedAt;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      if (elapsedMinutes >= user.minFocusMinutes) {
        user.minHitEmitted = true;

        this.roomService.broadcast({
          type: 'MIN_HIT',
          payload: {
            sessionId: user.sessionId,
            nickname: user.nickname,
            minFocusMinutes: user.minFocusMinutes,
          },
        });
      }
    });
  }
}
