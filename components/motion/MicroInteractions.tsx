'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { easing, duration } from '@/config/motion';
import Link from 'next/link';

/**
 * =========================================================
 * MICRO-INTERACTIONS
 * =========================================================
 * Subtle, premium button and input interactions
 */

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: AnimatedButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-colors rounded-xl';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }[variant];

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm sm:text-base',
    lg: 'px-8 py-4 text-base sm:text-lg',
  }[size];

  if (shouldReduceMotion) {
    return (
      <button
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      whileHover={{
        scale: 1.02,
        transition: {
          duration: duration.fast,
          ease: easing.signature,
        },
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          duration: duration.instant,
          ease: easing.signature,
        },
      }}
    >
      {children}
    </motion.button>
  );
}

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: AnimatedLinkProps) {
  const shouldReduceMotion = useReducedMotion();

  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-colors rounded-xl';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }[variant];

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm sm:text-base',
    lg: 'px-8 py-4 text-base sm:text-lg',
  }[size];

  if (shouldReduceMotion) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        transition: {
          duration: duration.fast,
          ease: easing.signature,
        },
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          duration: duration.instant,
          ease: easing.signature,
        },
      }}
    >
      <Link
        href={href}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

/**
 * =========================================================
 * ANIMATED INPUT
 * =========================================================
 * Input with focus state animations
 */

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function AnimatedInput({
  label,
  error,
  className = '',
  ...props
}: AnimatedInputProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">{label}</label>
        )}
        <input
          className={`
            w-full px-4 py-2 rounded-lg
            bg-background border border-input
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <motion.label
          className="block text-sm font-medium mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.fast,
            ease: easing.signature,
          }}
        >
          {label}
        </motion.label>
      )}
      <motion.input
        type={props.type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        name={props.name}
        id={props.id}
        className={`
          w-full px-4 py-2 rounded-lg
          bg-background border border-input
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        whileFocus={{
          scale: 1.01,
          transition: {
            duration: duration.fast,
            ease: easing.signature,
          },
        }}
      />
      {error && (
        <motion.p
          className="text-sm text-red-500 mt-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.fast,
            ease: easing.signature,
          }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/**
 * =========================================================
 * LOADING DOTS
 * =========================================================
 * Animated loading indicator
 */

export function LoadingDots({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const shouldReduceMotion = useReducedMotion();

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }[size];

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center gap-1">
        <div className={`${dotSize} rounded-full bg-current`} />
        <div className={`${dotSize} rounded-full bg-current`} />
        <div className={`${dotSize} rounded-full bg-current`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full bg-current`}
          animate={{
            y: [-3, 3, -3],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: easing.signature,
          }}
        />
      ))}
    </div>
  );
}

/**
 * =========================================================
 * PULSE RING
 * =========================================================
 * Animated pulse ring for status indicators
 */

export function PulseRing({
  color = 'blue',
  size = 'md',
}: {
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size];

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  }[color];

  if (shouldReduceMotion) {
    return <div className={`${sizeClasses} ${colorClasses} rounded-full`} />;
  }

  return (
    <div className="relative inline-flex">
      <div className={`${sizeClasses} ${colorClasses} rounded-full`} />
      <motion.span
        className={`absolute inset-0 rounded-full ${colorClasses}`}
        animate={{
          scale: [1, 2, 2],
          opacity: [0.6, 0, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: easing.signature,
        }}
      />
    </div>
  );
}

/**
 * =========================================================
 * ANIMATED ICON BUTTON
 * =========================================================
 * Icon button with hover rotation
 */

interface AnimatedIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  rotateOnHover?: boolean;
  className?: string;
}

export function AnimatedIconButton({
  children,
  rotateOnHover = false,
  className = '',
  ...props
}: AnimatedIconButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <button
        className={`inline-flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`inline-flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors ${className}`}
      whileHover={{
        scale: 1.1,
        rotate: rotateOnHover ? 90 : 0,
        transition: {
          duration: duration.fast,
          ease: easing.signature,
        },
      }}
      whileTap={{
        scale: 0.95,
        transition: {
          duration: duration.instant,
          ease: easing.signature,
        },
      }}
    >
      {children}
    </motion.button>
  );
}
