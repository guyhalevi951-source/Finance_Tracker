import { type PostgrestError } from '@supabase/supabase-js';

export function throwIfPostgrestError(
  error: PostgrestError | null,
  code: string,
): void {
  if (error) {
    throw new Error(code);
  }
}

export function throwIfStorageError(
  error: { message: string } | null,
  code: string,
): void {
  if (error) {
    throw new Error(code);
  }
}
