import type { ReactNode } from "react";
export function PageHeader({ title, description, eyebrow = "COMUNIDAD CONECTA", actions, compact = false }: {
  title: ReactNode; description?: ReactNode; eyebrow?: string; actions?: ReactNode; compact?: boolean;
}) {
  return <header className={`ui-page-heading ${compact ? "ui-page-heading-compact" : ""}`}><div className="ui-heading-copy"><p className="ui-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <div className="ui-heading-description">{description}</div>}</div>{actions && <div className="ui-heading-actions">{actions}</div>}<span className="ui-heading-orbit" aria-hidden="true" /></header>;
}
