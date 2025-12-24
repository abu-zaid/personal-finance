'use client';

import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BRAND_GRADIENT } from '@/lib/constants';

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
        strokeColor = BRAND_GRADIENT.from; // Using a color that likely matches 'primary' or a success color
        description = 'Your spending is well-managed and within budget.';
    } else if (score >= 60) {
        status = 'Good';
        colorClass = 'text-yellow-500';
        strokeColor = '#f59e0b';
        description = 'Your spending is mostly on track with some areas to improve.';
    }

    return (
        <Card className="overflow-hidden border-0 shadow-2xl" style={{ background: BRAND_GRADIENT.css }}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#101010]" />
                    <span className="text-[#101010]">Financial Health Score</span>
                </CardTitle>
                <CardDescription className="text-[#101010]/70">Based on your spending habits and budget adherence</CardDescription>
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
                                className="text-[#101010]/20"
                            />
                            <motion.circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke={score >= 80 ? '#101010' : strokeColor}
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 251.2' }}
                                animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-[#101010]">{roundedScore}</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className={cn("text-2xl font-bold mb-1 text-[#101010]")}>
                            {status}
                        </div>
                        <p className="text-sm text-[#101010]/80 leading-snug">
                            {description}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
