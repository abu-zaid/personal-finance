'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInsightsData } from '@/hooks/use-insights-data';

export function SmartInsights() {
    const { smartInsights } = useInsightsData();

    if (!smartInsights || smartInsights.length === 0) {
        return null;
    }

    // Take top 3 insights
    const topInsights = smartInsights.slice(0, 3);

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return AlertTriangle;
            case 'achievement': return TrendingUp;
            default: return Lightbulb;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'warning': return 'text-amber-500 bg-amber-500/10';
            case 'achievement': return 'text-green-500 bg-green-500/10';
            default: return 'text-primary bg-primary/10';
        }
    };

    return (
        <Card className="border-border/40 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Smart Insights</h3>
                            <p className="text-xs text-muted-foreground">AI-driven financial analysis</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden sm:flex text-xs">
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </div>

                <div className="space-y-4">
                    {topInsights.map((insight, index) => {
                        const Icon = getIcon(insight.type);
                        const colorClass = getColor(insight.type);

                        return (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                            >
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold truncate">{insight.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {insight.message}
                                    </p>
                                    {insight.action && (
                                        <Button variant="link" className="px-0 h-auto text-xs mt-1.5 font-medium">
                                            {insight.action}
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <Button variant="ghost" size="sm" className="w-full mt-4 sm:hidden text-xs">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
            </CardContent>
        </Card>
    );
}
