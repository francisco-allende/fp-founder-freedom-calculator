import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'quiet';

const cls = (variant: Variant, extra?: string) => [styles.button, styles[variant], extra].filter(Boolean).join(' ');

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ variant = 'primary', className, type = 'button', ...rest }, ref) {
    return <button ref={ref} type={type} className={cls(variant, className)} {...rest} />;
  },
);

export function ButtonLink({ variant = 'primary', className, ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={cls(variant, className)} {...rest} />;
}
