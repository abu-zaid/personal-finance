'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFinancialHealth } from '@/hooks/use-financial-health';
import { cn } from '@/lib/utils';

export function FinancialHealthScore() {
  const health = useFinancialHealth();

  const getStatusColor = () => {
    switch (health.status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-primary';
      case 'fair': return 'text-amber-500';
      case 'poor': return 'text-destructive';
    }
  };

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (health.overall / 100) * circumference;

  return (
    <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Financial Health</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Overall score</p>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", getStatusColor(), "bg-current/10")}>
            {health.status}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 md:w-36 md:h-36 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20 md:hidden"
              />
              <circle
                cx="72"
                cy="72"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20 hidden md:block"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 60}
                className={cn(getStatusColor(), "md:hidden")}
                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 60) - (health.overall / 100) * (2 * Math.PI * 60) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <motion.circle
                cx="72"
                cy="72"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                className={cn(getStatusColor(), "hidden md:block")}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl md:text-4xl font-bold", getStatusColor())}>{health.overall}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex-1 w-full min-w-0 space-y-3">
            <ScoreBar label="Savings" score={health.savingsRate} icon={Sparkles} />
            <ScoreBar label="Budget" score={health.budgetAdherence} icon={Target} />
            <ScoreBar label="Trend" score={health.spendingTrend} icon={health.spendingTrend >= 50 ? TrendingDown : TrendingUp} />
          </div>
        </div>

        {health.recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Wins</p>
            <ul className="space-y-1.5">
              {health.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const getColor = () => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-primary';
    if (score >= 25) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="font-bold">{score}</span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}
