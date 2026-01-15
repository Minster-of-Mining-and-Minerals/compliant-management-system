import React, { forwardRef, type FC } from "react";
import { cn } from "@/lib/utils";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
}

const Input: FC<InputProps> = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      id,
      name,
      placeholder,
      value,
      onChange,
      className = "",
      min,
      max,
      defaultValue,
      step,
      disabled = false,
      success = false,
      error = false,
      hint,
      required = false,
    },
    ref
  ) => {
    // Base styles from the first Input
    let inputClasses = cn(
      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      // Base focus for normal state
      !error && !success
        ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
        : "",
      // Focus for error state
      error
        ? "focus-visible:ring-red-200 focus-visible:border-red-500 dark:focus-visible:border-red-600"
        : "",
      // Focus for success state
      success
        ? "focus-visible:ring-green-200 focus-visible:border-green-500 dark:focus-visible:border-green-600"
        : "",
      // ARIA invalid styling
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      className
    );

    // Add conditional styles
    if (disabled) {
      inputClasses = cn(inputClasses, "opacity-40 cursor-not-allowed");
    } else if (error) {
      inputClasses = cn(
        inputClasses,
        "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-600"
      );
    } else if (success) {
      inputClasses = cn(
        inputClasses,
        "border-green-500 focus:ring-green-200 dark:border-green-600"
      );
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          defaultValue={defaultValue}
          className={inputClasses}
          readOnly={type === "date" || type === "time"}
        />
        {hint && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              error
                ? "text-red-500"
                : success
                ? "text-green-500"
                : "text-gray-500"
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
