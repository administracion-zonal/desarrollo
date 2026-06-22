import type { ButtonHTMLAttributes } from "react";

type Props = {
  label: string;
  icon: string;
  variant?: "neutral" | "primary" | "success" | "danger" | "warning";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export default function ActionIconButton({
  label,
  icon,
  variant = "neutral",
  className = "",
  type = "button",
  ...props
}: Props) {
  const classes = ["icon-action", `is-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
