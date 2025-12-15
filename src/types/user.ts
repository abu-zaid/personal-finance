// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  currency: Currency;
  dateFormat: DateFormat;
  theme: Theme;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'AED' | 'EGP';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type Theme = 'light' | 'dark' | 'system';
