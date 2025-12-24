'use client';

import { useAppSelector } from '@/lib/hooks';
import { selectUser } from '@/lib/features/auth/authSlice';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';
import { CURRENCY_OPTIONS } from '@/lib/constants';

/**
 * Hook to get the user's currency preference and format values accordingly
 */
export function useCurrency() {
  const user = useAppSelector(selectUser);
  const currency = user?.preferences?.currency || 'INR';

  const currencyOption = CURRENCY_OPTIONS.find((c) => c.value === currency);
  const symbol = currencyOption?.symbol || '₹';

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  return {
    currency,
    symbol,
    formatCurrency,
  };
}
