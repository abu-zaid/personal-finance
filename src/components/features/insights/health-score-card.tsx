'use client';

import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HealthScoreCardProps {
    score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
    const roundedScore = Math.round(score);

    let status = 'Needs Attention';
    let colorClass = 'text-destructive';
    let strokeColor = '#ef4444';
    let description = 'Consider reviewing your budget and spending habits.';

    if (score >= 80) {
        status = 'Excellent';
        colorClass = 'text-primary';
        strokeColor = '#98EF5A'; // Using a color that likely matches 'primary' or a success color
        description = 'Your spending is well-managed and within budget.';
    } else if (score >= 60) {
        status = 'Good';
        colorClass = 'text-yellow-500';
        strokeColor = '#f59e0b';
        description = 'Your spending is mostly on track with some areas to improve.';
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    Financial Health Score
                </CardTitle>
                <CardDescription>Based on your spending habits and budget adherence</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 flex-shrink-0">
                        <svg className="h-full w-full transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-muted/20"
                            />
                            <motion.circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke={strokeColor}
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 251.2' }}
                                animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{roundedScore}</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className={cn("text-2xl font-bold mb-1", colorClass)}>
                            {status}
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">
                            {description}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
