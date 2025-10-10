import React from 'react';
import './Badge.css';

/**
 * PUBLIC_INTERFACE
 * Badge - Small label for statuses and metadata.
 *
 * Props:
 * - variant?: 'info' | 'warning' | 'critical' | 'neutral' | 'success' | 'primary'
 * - children: React.ReactNode
 * - title?: string
 * - className?: string
 */
export default function Badge({ variant = 'neutral', children, title, className = '', ...rest }) {
  const cls = ['ui-badge', `ui-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} title={title} {...rest}>
      {children}
    </span>
  );
}
