/**
 * Code Input Component - Binance Style
 * 6-digit verification code input with auto-focus and paste support
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CodeInputProps {
  onComplete: (code: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  canResend?: boolean;
  countdown?: number;
  error?: string | null;
  disabled?: boolean;
}

export function CodeInput({
  onComplete,
  onResend,
  isLoading = false,
  isResending = false,
  canResend = true,
  countdown = 0,
  error,
  disabled = false,
}: CodeInputProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedCodeRef = useRef<string | null>(null);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when all 6 digits are filled (only once per unique code)
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isLoading && submittedCodeRef.current !== fullCode) {
      submittedCodeRef.current = fullCode;
      onComplete(fullCode);
    }
  }, [code, isLoading, onComplete]);

  // Reset submitted code ref when error occurs (allow retry)
  useEffect(() => {
    if (error) {
      submittedCodeRef.current = null;
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current and move to previous
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newCode = [...code];

      if (code[index]) {
        // Clear current digit
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        // Move to previous and clear it
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);

      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Input Boxes */}
      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading || disabled}
            className={`
              w-12 h-14 text-center text-2xl font-semibold
              bg-bg-tertiary border-2 rounded-lg
              text-text-primary
              focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-action-red' : 'border-bg-tertiary'}
            `}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-action-red text-center">
          {error}
        </p>
      )}

      {/* Resend Button */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-text-secondary">
          Didn&apos;t receive the code?
        </span>
        <Button
          type="button"
          variant="link"
          onClick={onResend}
          disabled={!canResend || isResending}
          className="text-brand-primary hover:text-brand-primary-light p-0 h-auto font-medium"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            'Resend Code'
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Verifying code...</span>
        </div>
      )}
    </div>
  );
}
