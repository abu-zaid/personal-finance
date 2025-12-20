'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
    showDots?: boolean;
    className?: string;
}

export function Sparkline({
    data,
    color = '#98EF5A',
    height = 32,
    showDots = false,
    className
}: SparklineProps) {
    const points = useMemo(() => {
        if (data.length === 0) return '';

        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;
        const width = 100;
        const step = width / (data.length - 1 || 1);

        return data.map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
    }, [data, height]);

    const dotPositions = useMemo(() => {
        if (!showDots || data.length === 0) return [];

        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;
        const width = 100;
        const step = width / (data.length - 1 || 1);

        return data.map((value, index) => ({
            x: index * step,
            y: height - ((value - min) / range) * height,
        }));
    }, [data, height, showDots]);

    if (data.length === 0) {
        return (
            <div
                className={cn("flex items-center justify-center", className)}
                style={{ height }}
            >
                <div className="h-0.5 w-full bg-muted/30" />
            </div>
        );
    }

    return (
        <svg
            viewBox={`0 0 100 ${height}`}
            className={cn("w-full", className)}
            style={{ height }}
            preserveAspectRatio="none"
        >
            {/* Area fill */}
            <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 0.5 }}
                d={`M ${points} L 100,${height} L 0,${height} Z`}
                fill={color}
            />

            {/* Line */}
            <motion.polyline
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {showDots && dotPositions.map((pos, index) => (
                <motion.circle
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05, duration: 0.2 }}
                    cx={pos.x}
                    cy={pos.y}
                    r="2"
                    fill={color}
                />
            ))}
        </svg>
    );
}
