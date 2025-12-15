'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { AnimatedNumber } from '@/components/animations';
import { useCurrency } from '@/hooks/use-currency';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  transactionCount?: number;
  budgetUsage?: number;
}

export function BalanceCard({ 
  balance, 
  income, 
  expenses,
  transactionCount = 0,
  budgetUsage = 0,
}: BalanceCardProps) {
  const { symbol } = useCurrency();

  const statsItems = [
    { icon: TrendingUp, label: 'Budget', value: income, isAmount: true },
    { icon: TrendingDown, label: 'Spent', value: expenses, isAmount: true },
    { icon: Wallet, label: 'Transactions', value: transactionCount, isAmount: false },
    { icon: PieChart, label: 'Budget Used', value: budgetUsage, isAmount: false, suffix: '%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-[24px] p-5"
      style={{
        background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 50%, #5AD920 100%)',
        boxShadow: '0 0 60px rgba(152, 239, 90, 0.25), 0 12px 40px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      
      {/* Balance Section */}
      <div className="relative mb-5">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-[#101010]/50 mb-1.5">
          Available Balance
        </p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[32px] leading-none font-bold text-[#101010] tracking-tight">
            {symbol}<AnimatedNumber value={balance} format="number" />
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-2 gap-2.5">
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
                <item.icon className="h-3.5 w-3.5 text-[#101010]" />
              </div>
              <span className="text-[10px] font-semibold text-[#101010]/60 uppercase tracking-wide">
                {item.label}
              </span>
            </div>
            <p className="relative text-[17px] font-bold text-[#101010]">
              {item.isAmount && symbol}
              <AnimatedNumber value={item.value} format="number" />
              {item.suffix}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
