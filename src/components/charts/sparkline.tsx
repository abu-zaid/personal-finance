'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChartTooltip } from './tooltip';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';

interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
    showDots?: boolean;
    className?: string;
    interactive?: boolean;
    onPointHover?: (index: number, value: number) => void;
    formatValue?: (value: number) => string;
}

export function Sparkline({
    data,
    color = '#98EF5A',
    height = 32,
    showDots = false,
    className,
    interactive = true,
    onPointHover,
    formatValue = (v) => v.toLocaleString(),
}: SparklineProps) {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const { tooltip, showTooltip, hideTooltip, isVisible } = useChartTooltip();

    const { points, dotPositions, max, min } = useMemo(() => {
        if (data.length === 0) return { points: '', dotPositions: [], max: 0, min: 0 };

        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;
        const width = 100;
        const step = width / (data.length - 1 || 1);

        const points = data.map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const dotPositions = data.map((value, index) => ({
            x: index * step,
            y: height - ((value - min) / range) * height,
            value,
        }));

        return { points, dotPositions, max, min };
    }, [data, height]);

    const handlePointHover = useCallback((index: number, event: React.MouseEvent<SVGElement>) => {
        if (!interactive) return;
        setHoveredPoint(index);
        const point = dotPositions[index];
        if (onPointHover) {
            onPointHover(index, point.value);
        }
        const rect = event.currentTarget.getBoundingClientRect();
        showTooltip(
            rect.left + (point.x / 100) * rect.width,
            rect.top,
            {
                index,
                value: point.value,
                formattedValue: formatValue(point.value),
            }
        );
    }, [interactive, dotPositions, onPointHover, showTooltip, formatValue]);

    const handleMouseLeave = useCallback(() => {
        if (!interactive) return;
        setHoveredPoint(null);
        hideTooltip();
    }, [interactive, hideTooltip]);

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
        <>
            <svg
                viewBox={`0 0 100 ${height}`}
                className={cn("w-full", className)}
                style={{ height }}
                preserveAspectRatio="none"
                onMouseLeave={handleMouseLeave}
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* Area fill with gradient */}
                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    d={`M ${points} L 100,${height} L 0,${height} Z`}
                    fill={`url(#gradient-${color})`}
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
                    className={cn(interactive && "transition-all")}
                    style={{
                        filter: hoveredPoint !== null ? `drop-shadow(0 0 4px ${color}80)` : undefined,
                    }}
                />

                {/* Interactive overlay for hover detection */}
                {interactive && dotPositions.map((pos, index) => (
                    <circle
                        key={index}
                        cx={pos.x}
                        cy={pos.y}
                        r="6"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={(e) => handlePointHover(index, e)}
                    />
                ))}

                {/* Dots - always show on hover or when showDots is true */}
                {dotPositions.map((pos, index) => {
                    const isHovered = hoveredPoint === index;
                    const shouldShow = showDots || isHovered;

                    return shouldShow ? (
                        <motion.circle
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: isHovered ? 1.5 : 1 }}
                            transition={{ duration: 0.2 }}
                            cx={pos.x}
                            cy={pos.y}
                            r="2.5"
                            fill={color}
                            stroke="white"
                            strokeWidth="1"
                            className="pointer-events-none"
                            style={{
                                filter: isHovered ? `drop-shadow(0 0 6px ${color})` : undefined,
                            }}
                        />
                    ) : null;
                })}

                {/* Crosshair on hover */}
                {interactive && hoveredPoint !== null && (
                    <motion.line
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        x1={dotPositions[hoveredPoint].x}
                        y1="0"
                        x2={dotPositions[hoveredPoint].x}
                        y2={height}
                        stroke={color}
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                )}
            </svg>

            {/* Tooltip */}
            {interactive && isVisible && tooltip && (
                <ChartTooltip visible={isVisible} x={tooltip.x} y={tooltip.y}>
                    <div className="text-xs space-y-0.5">
                        <p className="text-muted-foreground">
                            Point {tooltip.content.index + 1}
                        </p>
                        <p className="font-semibold text-foreground">
                            {tooltip.content.formattedValue}
                        </p>
                    </div>
                </ChartTooltip>
            )}
        </>
    );
}
