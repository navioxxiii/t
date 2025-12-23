/**
 * Password Strength Indicator
 * Shows real-time validation of password requirements with visual feedback
 */

'use client';

import { Check, X } from 'lucide-react';
import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: 'One uppercase letter (A-Z)',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'One lowercase letter (a-z)',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'One number (0-9)',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: 'One special character (!@#$...)',
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  // Calculate which requirements are met
  const results = useMemo(() => {
    return requirements.map((req) => ({
      label: req.label,
      met: req.test(password),
    }));
  }, [password]);

  // Calculate overall strength
  const metCount = results.filter((r) => r.met).length;
  const strength = useMemo(() => {
    if (metCount === 0) return { label: 'None', color: 'text-text-tertiary' };
    if (metCount <= 2) return { label: 'Weak', color: 'text-action-red' };
    if (metCount <= 4) return { label: 'Medium', color: 'text-brand-primary' };
    return { label: 'Strong', color: 'text-action-green' };
  }, [metCount]);

  // Don't show anything if password is empty
  if (!password) {
    return (
      <div className="text-xs text-text-tertiary mt-2">
        Password must meet all requirements below
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">Password Requirements:</p>
        {results.map((result, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors ${
              result.met ? 'text-action-green' : 'text-text-tertiary'
            }`}
          >
            {result.met ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{result.label}</span>
          </div>
        ))}
      </div>

      {/* Strength Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">Strength:</span>
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.label}
        </span>

        {/* Progress Bar */}
        <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              metCount === 0 ? 'w-0 bg-text-tertiary' :
              metCount <= 2 ? 'w-2/5 bg-action-red' :
              metCount <= 4 ? 'w-3/5 bg-brand-primary' :
              'w-full bg-action-green'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
