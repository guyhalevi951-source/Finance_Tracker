import { useEffect, useState } from 'react';
import { toIsoDate } from '../../domain/expenses/parseExpenseDate';
import { msUntilNextLocalMidnight } from '../dates/msUntilNextLocalMidnight';

export function useTodayIso(): string {
  const [todayIso, setTodayIso] = useState(() => toIsoDate(new Date()));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const syncToday = () => {
      const nextIso = toIsoDate(new Date());
      setTodayIso((current) => (current === nextIso ? current : nextIso));
    };

    const scheduleMidnight = () => {
      timeoutId = setTimeout(() => {
        syncToday();
        scheduleMidnight();
      }, msUntilNextLocalMidnight());
    };

    scheduleMidnight();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncToday();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return todayIso;
}
