export function calculateUserMode(user, now) {
  if (!user.joinedAt) return { mode: 'FOCUS', elapsed: 0, overtime: 0 };
  
  const elapsedMs = now - new Date(user.joinedAt);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const minFocus = user.minFocusMinutes;
  
  if (elapsedMinutes < minFocus) {
    return { mode: 'FOCUS', elapsed: elapsedMinutes, overtime: 0 };
  } else {
    const overtime = elapsedMinutes - minFocus;
    return { mode: 'EXTRA', elapsed: elapsedMinutes, overtime };
  }
}
