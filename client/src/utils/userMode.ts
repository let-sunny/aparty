import { User, UserMode } from '../types';

export function calculateUserMode(user: User, now: number): UserMode {
  if (!user.joinedAt) return { mode: 'FOCUS', elapsed: 0, overtime: 0 };
  
  const elapsedMs = now - new Date(user.joinedAt).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const minFocus = user.minFocusMinutes;
  
  if (elapsedMinutes < minFocus) {
    return { mode: 'FOCUS', elapsed: elapsedMinutes, overtime: 0 };
  } else {
    const overtime = elapsedMinutes - minFocus;
    return { mode: 'EXTRA', elapsed: elapsedMinutes, overtime };
  }
}
