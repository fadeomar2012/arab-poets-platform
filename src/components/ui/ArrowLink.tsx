import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function ArrowLink({
  href,
  children,
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const classes = `arrow-link ${className}`.trim();
  if (external) {
    return (
      <a className={classes} href={href} rel="noopener noreferrer" target="_blank">
        <span>{children}</span>
        <Icon name="external" />
      </a>
    );
  }
  return (
    <Link className={classes} href={href}>
      <span>{children}</span>
      <Icon className="arrow-link-icon" name="arrow" />
    </Link>
  );
}
