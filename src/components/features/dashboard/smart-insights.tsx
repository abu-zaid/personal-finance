'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, Trophy, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSmartInsights } from '@/hooks/use-smart-insights';
import { cn } from '@/lib/utils';

export function SmartInsights() {
    const insights = useSmartInsights();

    if (insights.length === 0) {
        return null;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'opportunity': return Zap;
            case 'warning': return AlertTriangle;
            case 'achievement': return Trophy;
            case 'tip': return Lightbulb;
            default: return Lightbulb;
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case 'opportunity':
                return {
                    bg: 'bg-primary/10 border-primary/20',
                    icon: 'bg-primary/20 text-primary',
                    text: 'text-primary-600 dark:text-primary-400',
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/20',
                    icon: 'bg-amber-500/20 text-amber-600',
                    text: 'text-amber-600 dark:text-amber-400',
                };
            case 'achievement':
                return {
                    bg: 'bg-green-500/10 border-green-500/20',
                    icon: 'bg-green-500/20 text-green-600',
                    text: 'text-green-600 dark:text-green-400',
                };
            case 'tip':
                return {
                    bg: 'bg-blue-500/10 border-blue-500/20',
                    icon: 'bg-blue-500/20 text-blue-500',
                    text: 'text-blue-600 dark:text-blue-400',
                };
            default:
                return {
                    bg: 'bg-muted/20 border-border/20',
                    icon: 'bg-muted text-muted-foreground',
                    text: 'text-foreground',
                };
        }
    };

    return (
        <div className=\"space-y-3\">
            < h3 className =\"text-sm font-bold text-muted-foreground uppercase tracking-wider\">Smart Insights</h3>
                < div className =\"space-y-3\">
    {
        insights.map((insight, index) => {
            const Icon = getIcon(insight.type);
            const colors = getColors(insight.type);

            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(\"border backdrop-blur-sm\", colors.bg)}>
                <CardContent className=\"p-4\">
                  <div className=\"flex items-start gap-3\">
                    <div className={cn(\"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl\", colors.icon)}>
                      <Icon className=\"h-5 w-5\" strokeWidth={2} />
                    </div>
                    <div className=\"flex-1 min-w-0\">
                < p className =\"text-xs font-bold uppercase tracking-wider opacity-90 mb-1\">{insight.title}</p>
                    < p className =\"text-sm font-medium leading-snug mb-2\">{insight.message}</p>
            {
                (insight.action || insight.impact) && (
                    <div className=\"flex flex-wrap items-center gap-2 text-xs\">
                {
                    insight.action && (
                        <span className=\"px-2 py-1 rounded-md bg-background/50 font-medium\">
                              → { insight.action }
                            </span >
                          )
    }
    {
        insight.impact && (
            <span className={cn(\"px-2 py-1 rounded-md font-bold\", colors.icon)}>
                              { insight.impact }
                            </span >
                          )}
                        </ div>
                      )}
            </div>
                  </div >
                </CardContent >
              </Card >
            </motion.div >
          );
    })
}
      </div >
    </div >
  );
}
