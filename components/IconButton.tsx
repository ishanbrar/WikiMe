"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  variant?: "secondary" | "primary";
}) {
  return (
    <button
      type="button"
      className={[
        "icon-btn",
        variant === "primary" ? "icon-btn--primary" : "icon-btn--secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
