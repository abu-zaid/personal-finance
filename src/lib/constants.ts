// App Constants

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FinanceFlow';
export const APP_DESCRIPTION = 'Your money, beautifully simple.';

// Default categories for new users (using hex colors)
export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: 'shopping-bag', color: '#22c55e' },      // green
  { name: 'Transportation', icon: 'car', color: '#3b82f6' },          // blue
  { name: 'Dining', icon: 'utensils-crossed', color: '#f97316' },     // orange
  { name: 'Entertainment', icon: 'film', color: '#a855f7' },          // purple
  { name: 'Shopping', icon: 'shirt', color: '#ec4899' },              // pink
  { name: 'Utilities', icon: 'zap', color: '#eab308' },               // yellow
  { name: 'Health', icon: 'heart', color: '#ef4444' },                // red
  { name: 'Education', icon: 'graduation-cap', color: '#6366f1' },    // indigo
  { name: 'Travel', icon: 'plane', color: '#06b6d4' },                // cyan
  { name: 'Other', icon: 'more-horizontal', color: '#64748b' },       // slate
] as const;

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'SAR', label: 'Saudi Riyal (ر.س)', symbol: 'ر.س' },
  { value: 'AED', label: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
  { value: 'EGP', label: 'Egyptian Pound (ج.م)', symbol: 'ج.م' },
] as const;

// Date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
] as const;

// Category colors with their Tailwind classes
export const CATEGORY_COLORS = {
  red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  lime: { bg: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
} as const;

// Category icons (matching CategoryIcon component)
export const CATEGORY_ICONS = {
  'utensils-crossed': 'Food & Dining',
  car: 'Transportation',
  home: 'Housing',
  zap: 'Utilities',
  film: 'Entertainment',
  'shopping-bag': 'Shopping',
  heart: 'Health',
  'graduation-cap': 'Education',
  plane: 'Travel',
  shirt: 'Clothing',
  dumbbell: 'Fitness',
  coffee: 'Coffee',
  gift: 'Gifts',
  'credit-card': 'Bills',
  'more-horizontal': 'Other',
} as const;

// Animation durations (in seconds for Framer Motion)
export const ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  page: 0.3,
} as const;

// Navigation items
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/budgets', label: 'Budgets', icon: 'wallet' },
  { href: '/transactions', label: 'Transactions', icon: 'list' },
  { href: '/insights', label: 'Insights', icon: 'chart' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
