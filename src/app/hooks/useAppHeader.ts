import { useEffect, type ReactNode } from 'react';
import { useAppHeaderContext } from '../providers/AppHeaderProvider';

type UseAppHeaderOptions = {
  title: string;
  actions?: ReactNode;
};

export function useAppHeader({ title, actions = null }: UseAppHeaderOptions): void {
  const { setHeader, resetHeader } = useAppHeaderContext();

  useEffect(() => {
    setHeader({ title, actions });
  }, [title, actions, setHeader]);

  useEffect(() => {
    return resetHeader;
  }, [resetHeader]);
}
