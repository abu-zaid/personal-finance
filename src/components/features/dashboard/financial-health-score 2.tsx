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

    const getStatusGradient = () => {
        switch (health.status) {
            case 'excellent': return 'from-green-500 to-emerald-400';
            case 'good': return 'from-primary to-primary/70';
            case 'fair': return 'from-amber-500 to-orange-400';
            case 'poor': return 'from-destructive to-red-400';
        }
    };

    const circumference = 2 * Math.PI * 70; // radius = 70
    const offset = circumference - (health.overall / 100) * circumference;

    return (
        <Card className=\"border-border/40 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-card to-card/50 backdrop-blur-sm\">
            < CardContent className =\"p-6\">
                < div className =\"flex items-center justify-between mb-4\">
                    < div >
                    <h3 className=\"text-sm font-bold text-muted-foreground uppercase tracking-wider\">Financial Health</h3>
                        < p className =\"text-xs text-muted-foreground/70 mt-0.5\">Overall score</p>
          </div >
          <div className={cn(\"px-3 py-1 rounded-full text-xs font-bold uppercase\", getStatusColor(), \"bg-current/10\")}>
            {health.status}
          </div>
        </div>

        <div className=\"flex items-center gap-6\">
          {/* Circular Gauge */}
          <div className=\"relative\">
            <svg className=\"w-36 h-36 -rotate-90\">
              {/* Background circle */}
              <circle
                cx=\"72\"
                cy=\"72\"
                r=\"70\"
                stroke=\"currentColor\"
                strokeWidth=\"8\"
                fill=\"none\"
                className=\"text-muted/20\"
              />
              {/* Progress circle */}
              <motion.circle
                cx=\"72\"
                cy=\"72\"
                r=\"70\"
                stroke=\"url(#healthGradient)\"
                strokeWidth=\"8\"
                fill=\"none\"
                strokeLinecap=\"round\"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: \"easeOut\" }}
              />
              <defs>
                <linearGradient id=\"healthGradient\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
                  <stop offset=\"0%\" className={cn(\"stop-color-current\", getStatusColor())} />
                  <stop offset=\"100%\" className={cn(\"stop-color-current\", getStatusColor())} style={{ opacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className=\"absolute inset-0 flex flex-col items-center justify-center\">
        < span className = {
            cn(\"text-4xl font-bold\", getStatusColor())}>{health.overall}</span>
              <span className =\"text-xs text-muted-foreground\">/ 100</span>
            </div>
          </div >

        {/* Breakdown */ }
        < div className =\"flex-1 space-y-3\">
            < ScoreBar label =\"Savings\" score={health.savingsRate} icon={Sparkles} />
                < ScoreBar label =\"Budget\" score={health.budgetAdherence} icon={Target} />
                    < ScoreBar label =\"Trend\" score={health.spendingTrend} icon={health.spendingTrend >= 50 ? TrendingDown : TrendingUp} />
          </div >
        </div >

        {/* Recommendations */ }
    {
        health.recommendations.length > 0 && (
            <div className=\"mt-4 pt-4 border-t border-border/50\">
                < p className =\"text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2\">Quick Wins</p>
                    < ul className =\"space-y-1.5\">
        {
            health.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className=\"text-sm text-muted-foreground flex items-start gap-2\">
            < span className =\"text-primary mt-0.5\">•</span>
            < span > { rec }</span >
                </li >
              ))
        }
            </ul >
          </div >
        )
    }
      </CardContent >
    </Card >
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
        <div className=\"space-y-1\">
            < div className =\"flex items-center justify-between text-xs\">
                < div className =\"flex items-center gap-1.5\">
                    < Icon className =\"h-3.5 w-3.5 text-muted-foreground\" strokeWidth={2} />
                        < span className =\"font-medium text-muted-foreground\">{label}</span>
        </div >
        <span className=\"font-bold\">{score}</span>
      </div >
        <div className=\"h-1.5 bg-muted/30 rounded-full overflow-hidden\">
            < motion.div
    className = {
        cn(\"h-full rounded-full\", getColor())}
            initial = {{ width: 0 }}
    animate = {{ width: `${score}%` }
}
transition = {{
    duration: 1, ease: \"easeOut\", delay: 0.2 }}
        />
      </div >
    </div >
  );
}
