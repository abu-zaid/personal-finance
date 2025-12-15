'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, PieChart, Target, AlertTriangle } from 'lucide-react';
import { AnimatedNumber } from '@/components/animations';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  transactionCount?: number;
  budgetUsage?: number;
}

export const BalanceCard = memo(function BalanceCard({ 
  balance, 
  income, 
  expenses,
  transactionCount = 0,
  budgetUsage = 0,
}: BalanceCardProps) {
  const { symbol } = useCurrency();

  const hasBudget = income > 0;
  const isOverBudget = balance < 0;
  const overBudgetAmount = Math.abs(balance);

  // Different card styles based on state
  const getCardStyle = () => {
    if (!hasBudget) {
      // No budget set - neutral gray/blue gradient
      return {
        background: 'linear-gradient(145deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
        boxShadow: '0 0 60px rgba(99, 102, 241, 0.25), 0 12px 40px rgba(0, 0, 0, 0.25)',
      };
    }
    if (isOverBudget) {
      // Over budget - red/orange gradient
      return {
        background: 'linear-gradient(145deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
        boxShadow: '0 0 60px rgba(248, 113, 113, 0.25), 0 12px 40px rgba(0, 0, 0, 0.25)',
      };
    }
    // Normal - green gradient
    return {
      background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 50%, #5AD920 100%)',
      boxShadow: '0 0 60px rgba(152, 239, 90, 0.25), 0 12px 40px rgba(0, 0, 0, 0.25)',
    };
  };

  const statsItems = hasBudget ? [
    { icon: TrendingUp, label: 'Budget', value: income, isAmount: true },
    { icon: TrendingDown, label: 'Spent', value: expenses, isAmount: true },
    { icon: Wallet, label: 'Transactions', value: transactionCount, isAmount: false },
    { icon: PieChart, label: 'Budget Used', value: Math.min(budgetUsage, 999), isAmount: false, suffix: '%' },
  ] : [
    { icon: TrendingDown, label: 'Spent', value: expenses, isAmount: true },
    { icon: Wallet, label: 'Transactions', value: transactionCount, isAmount: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-[24px] p-5"
      style={getCardStyle()}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      
      {/* Balance Section */}
      <div className="relative mb-5">
        {!hasBudget ? (
          // No Budget State
          <>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-white/60 mb-1.5">
              Total Spent This Month
            </p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[32px] leading-none font-bold text-white tracking-tight">
                {symbol}<AnimatedNumber value={expenses} format="number" />
              </span>
            </div>
            <Link href="/budgets">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 cursor-pointer transition-colors hover:bg-white/30"
              >
                <Target className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Set a Monthly Budget</span>
              </motion.div>
            </Link>
          </>
        ) : isOverBudget ? (
          // Over Budget State
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-white/80" />
              <p className="text-[11px] font-semibold tracking-wide uppercase text-white/80">
                Over Budget
              </p>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[32px] leading-none font-bold text-white tracking-tight">
                -{symbol}<AnimatedNumber value={overBudgetAmount} format="number" />
              </span>
            </div>
            <p className="text-white/70 text-sm mt-1">
              You&apos;ve exceeded your {symbol}{income.toLocaleString()} budget
            </p>
          </>
        ) : (
          // Normal State - Has Budget, Within Limit
          <>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-[#101010]/50 mb-1.5">
              Available Balance
            </p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[32px] leading-none font-bold text-[#101010] tracking-tight">
                {symbol}<AnimatedNumber value={balance} format="number" />
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "relative grid gap-2.5",
        hasBudget ? "grid-cols-2" : "grid-cols-2"
      )}>
        {statsItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            className="group relative overflow-hidden rounded-2xl p-3 transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Hover shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            
            <div className="relative flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 shadow-sm">
                <item.icon className={cn(
                  "h-3.5 w-3.5",
                  hasBudget && !isOverBudget ? "text-[#101010]" : "text-white"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                hasBudget && !isOverBudget ? "text-[#101010]/60" : "text-white/70"
              )}>
                {item.label}
              </span>
            </div>
            <p className={cn(
              "relative text-[17px] font-bold",
              hasBudget && !isOverBudget ? "text-[#101010]" : "text-white"
            )}>
              {item.isAmount && symbol}
              <AnimatedNumber value={item.value} format="number" />
              {item.suffix}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
