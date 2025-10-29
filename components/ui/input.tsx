import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={
        "w-full rounded-md border bg-white px-3 py-2 text-sm text-black " +
        "focus:outline-none focus-visible:ring-2 " + className
      }
      {...props}
    />
  )
);
Input.displayName = "Input";
