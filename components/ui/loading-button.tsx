import { forwardRef } from 'react';
import { Button, type ButtonProps } from './button';

/**
 * =========================================================
 * LOADING BUTTON COMPONENT (DEPRECATED)
 * =========================================================
 *
 * This component now wraps the canonical Button component.
 * Use <Button loading={true}> directly instead.
 *
 * @deprecated Use <Button loading={isLoading}> from '@/components/ui/button'
 *
 * Migration:
 *   OLD: <LoadingButton loading={isSubmitting}>Save</LoadingButton>
 *   NEW: <Button loading={isSubmitting}>Save</Button>
 */

interface LoadingButtonProps extends Omit<
  ButtonProps,
  'loading' | 'variant' | 'size'
> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// Map old variant names to canonical Button variants
const VARIANT_MAP: Record<string, ButtonProps['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
};

const SIZE_MAP: Record<string, ButtonProps['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        loading={loading}
        variant={VARIANT_MAP[variant] || 'default'}
        size={SIZE_MAP[size] || 'default'}
        {...props}
      />
    );
  },
);

LoadingButton.displayName = 'LoadingButton';
