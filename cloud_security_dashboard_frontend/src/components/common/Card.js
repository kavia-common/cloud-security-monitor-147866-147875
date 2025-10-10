import React from 'react';
import './Card.css';

/**
 * PUBLIC_INTERFACE
 * Card - Themed surface container with optional header/footer.
 *
 * Props:
 * - title?: string | React.ReactNode
 * - actions?: React.ReactNode
 * - children: React.ReactNode
 * - role?: string
 * - className?: string
 */
export default function Card({ title, actions, children, role, className = '', ...rest }) {
  return (
    <section className={`ui-card ${className}`} role={role} {...rest}>
      {(title || actions) && (
        <header className="ui-card__header">
          {title && <h3 className="ui-card__title">{title}</h3>}
          {actions && <div className="ui-card__actions">{actions}</div>}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </section>
  );
}
