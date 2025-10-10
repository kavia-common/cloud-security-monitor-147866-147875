import React from 'react';
import './Button.css';

/**
 * PUBLIC_INTERFACE
 * Button - Themed button primitive with variants and sizes.
 *
 * Props:
 * - variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'default'
 * - size?: 'sm' | 'md' | 'lg'
 * - disabled?: boolean
 * - fullWidth?: boolean
 * - onClick?: (e: MouseEvent) => void
 * - type?: 'button' | 'submit' | 'reset'
 * - ariaLabel?: string
 * - children: React.ReactNode
 */
export default function Button({
  variant = 'default',
  size = 'md',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ariaLabel,
  children,
  ...rest
}) {
  const className = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    disabled ? 'is-disabled' : '',
    fullWidth ? 'is-full' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
}
