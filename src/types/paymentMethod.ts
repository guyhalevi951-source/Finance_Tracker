export const PAYMENT_METHOD_IDS = ['cash', 'creditCard', 'bankTransfer'] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = 'cash';

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return (PAYMENT_METHOD_IDS as readonly string[]).includes(value);
}
