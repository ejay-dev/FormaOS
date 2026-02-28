import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
        xl: 'calc(var(--radius) + 4px)',
      },

      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: 'hsl(var(--sidebar))',
        'sidebar-foreground': 'hsl(var(--sidebar-foreground))',

        // Marketing surface tokens
        'marketing-bg': 'hsl(var(--marketing-bg))',
        'marketing-bg-alt': 'hsl(var(--marketing-bg-alt))',
        'marketing-surface': 'hsl(var(--marketing-surface))',
        'marketing-card': 'hsl(var(--marketing-card))',

        // Canvas scale — deep dark backgrounds.
        // Use bg-canvas-950 / bg-canvas-850 etc. instead of bg-[#0a0f1c]
        canvas: {
          950: 'var(--space-950)', // #030509 — deepest
          900: 'var(--space-900)', // #060a12
          850: 'var(--space-850)', // #080d18
          800: 'var(--space-800)', // #0a101f — primary app bg
          750: 'var(--space-750)', // #0d1326
          700: 'var(--space-700)', // #10162d
          650: 'var(--space-650)', // #141b35
          600: 'var(--space-600)', // #18203d — subtle elevated surface
        },

        // Wire/accent primaries — the brand colour palette for nodes and glows.
        // Use text-wire-cyan / bg-wire-cyan instead of #06b6d4 / #00d4fb
        wire: {
          cyan: 'var(--wire-policy-control)',   // #00d4fb
          teal: 'var(--wire-control-evidence)', // #14b8a6
          violet: 'var(--wire-evidence-audit)', // #a78bfa
          amber: 'var(--wire-audit-risk)',       // #f59e0b
          rose: 'var(--wire-risk-task)',         // #f43f5e
          emerald: 'var(--wire-task-control)',   // #10b981
        },

        // Glass surface shorthands.
        // Use bg-glass-subtle / bg-glass-strong instead of bg-white/[0.04]
        glass: {
          subtle: 'var(--glass-bg)',            // rgba(255,255,255,0.04)
          strong: 'var(--glass-bg-strong)',     // rgba(255,255,255,0.08)
          border: 'var(--glass-border)',        // rgba(255,255,255,0.10)
          'border-strong': 'var(--glass-border-strong)', // rgba(255,255,255,0.16)
        },

        // Status semantic tokens
        success: 'hsl(var(--success))',
        'success-foreground': 'hsl(var(--success-foreground))',
        warning: 'hsl(var(--warning))',
        'warning-foreground': 'hsl(var(--warning-foreground))',
        info: 'hsl(var(--info))',
        'info-foreground': 'hsl(var(--info-foreground))',
      },

      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        hero: ['var(--font-hero)'],
        mono: ['var(--font-mono)'],
      },

      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },

      boxShadow: {
        premium: 'var(--shadow-md)',
        'premium-lg': 'var(--shadow-lg)',
        'premium-xl': 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
};

export default config;
