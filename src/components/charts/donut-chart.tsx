'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DonutChartSegment {
    value: number;
    color: string;
    label: string;
}

interface DonutChartProps {
    data: DonutChartSegment[];
    size?: number;
    thickness?: number;
    showLabels?: boolean;
    centerContent?: React.ReactNode;
    className?: string;
}

export function DonutChart({
    data,
    size = 200,
    thickness = 30,
    showLabels = false,
    centerContent,
    className
}: DonutChartProps) {
    const total = useMemo(() =>
        data.reduce((sum, segment) => sum + segment.value, 0),
        [data]
    );

    const segments = useMemo(() => {
        if (total === 0) return [];

        const radius = (size - thickness) / 2;
        const circumference = 2 * Math.PI * radius;
        let currentAngle = -90; // Start from top

        return data.map((segment) => {
            const percentage = (segment.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const dashArray = `${(percentage / 100) * circumference} ${circumference}`;

            const result = {
                ...segment,
                percentage,
                dashArray,
                dashOffset: -((currentAngle + 90) / 360) * circumference,
                radius,
                circumference,
            };

            currentAngle += angle;
            return result;
        });
    }, [data, total, size, thickness]);

    const center = size / 2;
    const radius = (size - thickness) / 2;

    if (total === 0) {
        return (
            <div
                className={cn("flex items-center justify-center rounded-full bg-muted/20", className)}
                style={{ width: size, height: size }}
            >
                <p className="text-xs text-muted-foreground">No data</p>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={thickness}
                    className="text-muted/10"
                />

                {/* Segments */}
                {segments.map((segment, index) => (
                    <motion.circle
                        key={index}
                        cx={center}
                        cy={center}
                        r={segment.radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={thickness}
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.dashOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${segment.circumference}` }}
                        animate={{ strokeDasharray: segment.dashArray }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    />
                ))}
            </svg>

            {/* Center content */}
            {centerContent && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {centerContent}
                </div>
            )}

            {/* Labels */}
            {showLabels && (
                <div className="absolute -bottom-2 left-0 right-0 flex flex-wrap gap-2 justify-center mt-4">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                                {segment.label} ({segment.percentage.toFixed(0)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
