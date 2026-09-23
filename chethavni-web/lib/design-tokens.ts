/**
 * Design System Tokens for Chethavni
 *
 * Centralized design tokens for consistent styling across the application.
 * These tokens define the visual language and should be used throughout components.
 */

export const colors = {
  // Primary brand color - used for main actions and brand identity
  primary: {
    50: 'sky-50',
    100: 'sky-100',
    200: 'sky-200',
    300: 'sky-300',
    500: 'sky-500',
    600: 'sky-600',
    700: 'sky-700',
  },

  // Secondary/accent color - used for secondary paths and visual accents
  secondary: {
    50: 'violet-50',
    100: 'violet-100',
    200: 'violet-200',
    500: 'violet-500',
    600: 'violet-600',
    700: 'violet-700',
  },

  // Success state - pipeline active, successful operations
  success: {
    50: 'emerald-50',
    100: 'emerald-100',
    500: 'emerald-500',
    600: 'emerald-600',
    700: 'emerald-700',
  },

  // Warning state - quota approaching, attention needed
  warning: {
    50: 'amber-50',
    100: 'amber-100',
    500: 'amber-500',
    600: 'amber-600',
    700: 'amber-700',
  },

  // Error/destructive state - errors, delete actions
  error: {
    50: 'rose-50',
    100: 'rose-100',
    500: 'rose-500',
    600: 'rose-600',
    700: 'rose-700',
    900: 'rose-900',
  },

  // Neutral colors - text, backgrounds, borders
  neutral: {
    50: 'slate-50',
    100: 'slate-100',
    200: 'slate-200',
    300: 'slate-300',
    400: 'slate-400',
    500: 'slate-500',
    600: 'slate-600',
    700: 'slate-700',
    800: 'slate-800',
    900: 'slate-900',
    950: 'slate-950',
  },

  // Background colors
  background: {
    app: 'bg-[#f8fbff]', // Main app background
    card: 'bg-white',
    elevated: 'bg-white',
    input: 'bg-slate-50',
  },
} as const

export const typography = {
  // Page title - main heading on each page
  pageTitle: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-950',

  // Section heading - major sections within a page
  sectionHeading: 'text-base font-semibold text-slate-950',

  // Subsection heading - smaller divisions
  subsectionHeading: 'text-sm font-semibold text-slate-900',

  // Body text - main content
  body: 'text-sm leading-relaxed text-slate-700',

  // Supporting text - descriptions, help text
  supporting: 'text-xs leading-5 text-slate-500',

  // Label - form labels, small headings
  label: 'text-xs font-semibold text-slate-700',

  // Small label - badges, tags, metadata
  smallLabel: 'text-[10px] font-semibold uppercase tracking-[0.14em]',

  // Code/monospace
  code: 'font-mono text-xs text-slate-700',
} as const

export const spacing = {
  // Section gaps
  sectionGap: 'space-y-8 sm:space-y-10',

  // Card/container padding
  cardPadding: 'p-5 sm:p-6',
  cardPaddingSmall: 'p-4',

  // Form field gaps
  formGap: 'space-y-4',
  formGapCompact: 'space-y-3',

  // Button gaps (icon + text)
  buttonGap: 'gap-1.5',
  buttonGapSmall: 'gap-1',

  // Grid gaps
  gridGap: 'gap-3',
  gridGapLarge: 'gap-4',

  // Layout spacing
  pageX: 'px-5 sm:px-7',
  pageY: 'py-8 sm:py-10',
} as const

export const borders = {
  // Standard border
  default: 'border border-slate-200',

  // Elevated element border
  elevated: 'border border-sky-100',

  // Dashed border for empty states
  dashed: 'border border-dashed border-sky-200',

  // Focus ring
  focusRing: 'focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:border-sky-300',

  // Error state
  errorBorder: 'border-rose-500 focus-visible:ring-rose-200',
} as const

export const radius = {
  // Button, input radius
  default: 'rounded-lg',

  // Card radius
  card: 'rounded-xl',

  // Small elements (badges)
  small: 'rounded-md',

  // Pills (badges, status indicators)
  full: 'rounded-full',
} as const

export const shadows = {
  // Subtle shadow for elevated cards
  card: 'shadow-sm',

  // Hover state shadow
  hover: 'hover:shadow-[0_8px_30px_rgba(14,165,233,0.08)]',

  // Dialog/modal shadow
  modal: 'shadow-2xl',
} as const

export const transitions = {
  // Standard transition
  default: 'transition-all duration-150',

  // Fast transition for micro-interactions
  fast: 'transition-all duration-100',

  // Medium transition
  medium: 'transition-all duration-200',

  // Color transition only
  colors: 'transition-colors duration-150',

  // Transform transition
  transform: 'transition-transform duration-150',
} as const

export const iconSizes = {
  // Inline icon (next to text)
  inline: 'h-3.5 w-3.5',

  // Standard icon
  default: 'h-4 w-4',

  // Larger icon for emphasis
  large: 'h-5 w-5',

  // Icon in button
  button: 'h-4 w-4',

  // Icon in larger button
  buttonLarge: 'h-4.5 w-4.5',
} as const

export const interactiveStates = {
  // Button press feedback
  buttonPress: 'active:translate-y-px',

  // Card hover
  cardHover: 'hover:-translate-y-0.5',

  // Disabled state
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

  // Hover background
  hoverBg: 'hover:bg-slate-50',

  // Focus state
  focus: 'focus:outline-none focus-visible:ring-2',
} as const

// Badge/status variants
export const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  paused: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  error: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  neutral: 'bg-slate-50 text-slate-600 ring-1 ring-slate-100',
} as const

// Button variants (semantic)
export const buttonStyles = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 ring-1 ring-sky-600',
  primarySoft: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100',
  secondary: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 ring-1 ring-rose-600',
  destructiveSoft: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100',
  ghost: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
} as const

// Integration-specific colors (for destination cards)
export const integrationColors = {
  telegram: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    ring: 'ring-sky-100',
  },
  discord: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    ring: 'ring-violet-100',
  },
  slack: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    ring: 'ring-indigo-100',
  },
  email: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    ring: 'ring-sky-100',
  },
  webhook: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    ring: 'ring-violet-100',
  },
} as const
