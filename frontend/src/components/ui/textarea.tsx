"use client";
import React, { type FC } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps {
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  hint?: string;
  id?: string;
  maxLength?: number;
}

const TextArea: FC<TextareaProps> = ({
  placeholder = "Enter your message",
  rows = 3,
  value = "",
  onChange,
  onBlur,
  className = "",
  disabled = false,
  error = false,
  success = false,
  hint = "",
  id,
  maxLength,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e.target.value);
  };

  // Base classes (same as Input)
  let textareaClasses = cn(
    "file:text-foreground  placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    // Normal focus
    !error && !success
      ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
      : "",
    // Error focus
    error
      ? "focus-visible:ring-red-200 focus-visible:border-red-500 dark:focus-visible:border-red-600"
      : "",
    // Success focus
    success
      ? "focus-visible:ring-green-200 focus-visible:border-green-500 dark:focus-visible:border-green-600"
      : "",
    className
  );

  // Conditional disabled/error/success styles
  if (disabled) {
    textareaClasses = cn(
      textareaClasses,
      "opacity-40 cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    );
  } else if (error) {
    textareaClasses = cn(
      textareaClasses,
      "border-red-500 dark:border-red-600"
    );
  } else if (success) {
    textareaClasses = cn(
      textareaClasses,
      "border-green-500 dark:border-green-600"
    );
  } else {
    textareaClasses = cn(
      textareaClasses,
      " border-golden-dark text-gray-900 dark:text-white/90"
    );
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            error ? "text-red-500" : success ? "text-green-500" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export { TextArea };
