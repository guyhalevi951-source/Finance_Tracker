import { Lock, Mail, type LucideIcon } from 'lucide-react';
import { AUTH_FIELD_CLASS, AUTH_FIELD_ICON_CLASS, AUTH_FIELD_WRAP_CLASS } from '../authFormStyles';

interface AuthIconFieldProps {
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  autoComplete: string;
  disabled?: boolean;
}

const FIELD_ICONS: Record<AuthIconFieldProps['type'], LucideIcon> = {
  email: Mail,
  password: Lock,
};

export function AuthIconField({
  type,
  value,
  onChange,
  placeholder,
  ariaLabel,
  autoComplete,
  disabled = false,
}: AuthIconFieldProps) {
  const Icon = FIELD_ICONS[type];

  return (
    <div className={AUTH_FIELD_WRAP_CLASS}>
      <span className={AUTH_FIELD_ICON_CLASS} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className={AUTH_FIELD_CLASS}
      />
    </div>
  );
}
