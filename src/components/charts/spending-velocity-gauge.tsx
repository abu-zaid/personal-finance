'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

interface SpendingVelocityGaugeProps {
    currentSpending: number;
    budget: number;
    daysElapsed: number;
    daysInMonth: number;
    className?: string;
}

export function SpendingVelocityGauge({
    currentSpending,
    budget,
    daysElapsed,
    daysInMonth,
    className,
}: SpendingVelocityGaugeProps) {
    const { formatCurrency } = useCurrency();

    const metrics = useMemo(() => {
        const idealSpendingRate = budget / daysInMonth;
        const actualSpendingRate = daysElapsed > 0 ? currentSpending / daysElapsed : 0;
        const projectedTotal = actualSpendingRate * daysInMonth;
        const velocityRatio = idealSpendingRate > 0 ? (actualSpendingRate / idealSpendingRate) * 100 : 0;

        // Clamp between 0 and 200 for display
        const displayVelocity = Math.min(Math.max(velocityRatio, 0), 200);

        return {
            idealRate: idealSpendingRate,
            actualRate: actualSpendingRate,
            projectedTotal,
            velocityRatio,
            displayVelocity,
            isOverPace: velocityRatio > 100,
            status: velocityRatio > 120 ? 'danger' : velocityRatio > 100 ? 'warning' : 'good',
        };
    }, [currentSpending, budget, daysElapsed, daysInMonth]);

    const getStatusColor = () => {
        switch (metrics.status) {
            case 'danger': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#98EF5A';
        }
    };

    const getStatusLabel = () => {
        switch (metrics.status) {
            case 'danger': return 'High Risk';
            case 'warning': return 'Over Pace';
            default: return 'On Track';
        }
    };

    // Calculate arc path for gauge
    const size = 160;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // Half circle

    // Needle angle (0 to 180 degrees)
    const needleAngle = (metrics.displayVelocity / 200) * 180;

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
                <svg width={size} height={size / 2 + 20} className="overflow-visible">
                    {/* Background arc */}
                    <path
                        d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="text-muted/10"
                    />

                    {/* Colored segments */}
                    {/* Green segment (0-100%) */}
                    <motion.path
                        d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${center} ${strokeWidth / 2}`}
                        fill="none"
                        stroke="#98EF5A"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    {/* Yellow segment (100-120%) */}
                    <motion.path
                        d={`M ${center} ${strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${center + radius * 0.866} ${center - radius * 0.5}`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    />

                    {/* Red segment (120-200%) */}
                    <motion.path
                        d={`M ${center + radius * 0.866} ${center - radius * 0.5} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    />

                    {/* Needle */}
                    <motion.line
                        x1={center}
                        y1={center}
                        x2={center + (radius - 10) * Math.cos((needleAngle - 90) * Math.PI / 180)}
                        y2={center + (radius - 10) * Math.sin((needleAngle - 90) * Math.PI / 180)}
                        stroke={getStatusColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ rotate: -90 }}
                        animate={{ rotate: needleAngle - 90 }}
                        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        style={{ transformOrigin: `${center}px ${center}px` }}
                    />

                    {/* Center dot */}
                    <circle
                        cx={center}
                        cy={center}
                        r="6"
                        fill={getStatusColor()}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute bottom-0 left-0 right-0 text-center">
                    <p className="text-2xl font-bold" style={{ color: getStatusColor() }}>
                        {metrics.velocityRatio.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {getStatusLabel()}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Daily Rate</p>
                    <p className="text-sm font-semibold mt-0.5">
                        {formatCurrency(metrics.actualRate)}
                    </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Projected</p>
                    <p className={cn(
                        "text-sm font-semibold mt-0.5",
                        metrics.projectedTotal > budget && "text-destructive"
                    )}>
                        {formatCurrency(metrics.projectedTotal)}
                    </p>
                </div>
            </div>
        </div>
    );
}
