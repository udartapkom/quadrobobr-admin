import { ButtonHTMLAttributes, ElementType } from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger';
  fullWidth?: boolean;
  as?: ElementType;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  as: Component = 'button',
  className = '',
  ...props 
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
}

