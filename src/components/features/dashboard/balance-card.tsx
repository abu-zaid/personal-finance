'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components/animations';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="gradient-primary rounded-[24px] p-5 shadow-[0_12px_40px_rgba(152,239,90,0.3)]"
    >
      {/* Balance Section */}
      <div className="mb-4">
        <p className="text-xs font-medium text-[#101010]/60 mb-1">Available Balance</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] leading-tight font-bold text-[#101010]">
            ₹<AnimatedNumber value={balance} format="number" />
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <div className="bg-white/30 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50">
              <TrendingUp className="h-3.5 w-3.5 text-[#101010]" />
            </div>
            <span className="text-[10px] font-medium text-[#101010]/60">Budget</span>
          </div>
          <p className="text-base font-bold text-[#101010]">
            ₹<AnimatedNumber value={income} format="number" />
          </p>
        </div>

        {/* Expenses */}
        <div className="bg-white/30 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50">
              <TrendingDown className="h-3.5 w-3.5 text-[#101010]" />
            </div>
            <span className="text-[10px] font-medium text-[#101010]/60">Spent</span>
          </div>
          <p className="text-base font-bold text-[#101010]">
            ₹<AnimatedNumber value={expenses} format="number" />
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-white/30 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50">
              <Wallet className="h-3.5 w-3.5 text-[#101010]" />
            </div>
            <span className="text-[10px] font-medium text-[#101010]/60">Transactions</span>
          </div>
          <p className="text-base font-bold text-[#101010]">{transactionCount}</p>
        </div>

        {/* Budget Usage */}
        <div className="bg-white/30 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium text-[#101010]/60">Budget Used</span>
          </div>
          <p className="text-base font-bold text-[#101010]">{budgetUsage.toFixed(0)}%</p>
        </div>
      </div>
    </motion.div>
  );
}
