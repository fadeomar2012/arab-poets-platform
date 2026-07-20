import type { ReactNode } from "react";

export function PageHero({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-decoration" aria-hidden="true" />
      <div className="container page-hero-inner reveal">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
      </div>
    </section>
  );
}
