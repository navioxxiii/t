/**
 * PIN Input Component
 * Reusable 4-digit PIN input with auto-focus and backspace support
 */

"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/utils/haptics";

interface PinInputProps {
  onComplete: (pin: string) => void;
  onClear?: () => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PinInput({
  onComplete,
  onClear,
  error = false,
  disabled = false,
  autoFocus = true,
}: PinInputProps) {
  const [pins, setPins] = useState(["", "", "", ""]);
  const [resetKey, setResetKey] = useState(0);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, resetKey]);

  // When error changes to true, reset the inputs
  useEffect(() => {
    if (error) {
      haptics.error();
      setPins(["", "", "", ""]);
      setResetKey((prev) => prev + 1);
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);

    const newPins = [...pins];
    newPins[index] = digit;
    setPins(newPins);

    // Haptic feedback on digit entry
    if (digit) {
      haptics.light();
    }

    // Auto-focus next input if digit entered
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Check if all 4 digits entered
    if (digit && index === 3) {
      const fullPin = newPins.join("");
      if (fullPin.length === 4) {
        onComplete(fullPin);
      }
    }

    // Call onClear when all inputs are empty
    if (onClear && newPins.every((p) => p === "")) {
      onClear();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();

      if (pins[index]) {
        // Clear current digit
        const newPins = [...pins];
        newPins[index] = "";
        setPins(newPins);
      } else if (index > 0) {
        // Move to previous input and clear it
        const newPins = [...pins];
        newPins[index - 1] = "";
        setPins(newPins);
        inputRefs[index - 1].current?.focus();
      }
    }

    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 4);
        if (digits.length === 4) {
          const newPins = digits.split("");
          setPins(newPins);
          inputRefs[3].current?.focus();
          onComplete(digits);
        }
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 4);

    if (digits.length === 4) {
      const newPins = digits.split("");
      setPins(newPins);
      inputRefs[3].current?.focus();
      onComplete(digits);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={inputRefs[index]}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-14 h-14 text-center text-2xl font-bold ${
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-border focus-visible:ring-primary"
          }`}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
