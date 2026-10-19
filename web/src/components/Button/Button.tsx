import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./Button.module.scss";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "ghost";
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "ghost",
  icon,
  fullWidth = false,
  className,
  type = "button",
  children,
  ...buttonProps
}: ButtonProps) {
  const classNames = [styles["button"], styles[variant], fullWidth ? styles["full-width"] : "", className ?? ""];

  return (
    <button type={type} className={classNames.filter(Boolean).join(" ")} {...buttonProps}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
