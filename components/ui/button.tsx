import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };
export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        className
      }
      {...props}
    />
  );
}
