export function msUntilNextLocalMidnight(from: Date = new Date()): number {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next.getTime() - from.getTime();
}
