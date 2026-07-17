import { type ReactNode } from 'react';

export type AppHeaderSlotState = {
  title: string | null;
  actions: ReactNode | null;
};
