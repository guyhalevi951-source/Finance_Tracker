import { CreditCard, Landmark, Wallet, type LucideIcon } from 'lucide-react';
import { type PaymentMethodId } from '../../../types/paymentMethod';

const PAYMENT_METHOD_ICONS: Record<PaymentMethodId, LucideIcon> = {
  cash: Wallet,
  creditCard: CreditCard,
  bankTransfer: Landmark,
};

interface PaymentMethodIconProps {
  methodId: PaymentMethodId;
  className?: string;
}

export function PaymentMethodIcon({ methodId, className }: PaymentMethodIconProps) {
  const Icon = PAYMENT_METHOD_ICONS[methodId];
  return <Icon className={className} aria-hidden />;
}
