'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChartTooltip } from './tooltip';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';

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
    onSegmentClick?: (segment: DonutChartSegment, index: number) => void;
    selectedSegment?: number;
    interactive?: boolean;
}

export function DonutChart({
    data,
    size = 200,
    thickness = 30,
    showLabels = false,
    centerContent,
    className,
    onSegmentClick,
    selectedSegment,
    interactive = true,
}: DonutChartProps) {
    const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
    const { tooltip, showTooltip, hideTooltip, isVisible } = useChartTooltip();

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
                angle: currentAngle + angle / 2, // Middle angle for positioning
            };

            currentAngle += angle;
            return result;
        });
    }, [data, total, size, thickness]);

    const handleSegmentHover = useCallback((index: number, event: React.MouseEvent) => {
        if (!interactive) return;
        setHoveredSegment(index);
        const segment = segments[index];
        showTooltip(
            event.clientX,
            event.clientY,
            {
                label: segment.label,
                value: segment.value,
                percentage: segment.percentage,
            }
        );
    }, [interactive, segments, showTooltip]);

    const handleSegmentLeave = useCallback(() => {
        if (!interactive) return;
        setHoveredSegment(null);
        hideTooltip();
    }, [interactive, hideTooltip]);

    const handleSegmentClick = useCallback((segment: DonutChartSegment, index: number) => {
        if (interactive && onSegmentClick) {
            onSegmentClick(segment, index);
        }
    }, [interactive, onSegmentClick]);

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
        <>
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
                    {segments.map((segment, index) => {
                        const isHovered = hoveredSegment === index;
                        const isSelected = selectedSegment === index;
                        const isActive = isHovered || isSelected;

                        return (
                            <g key={index}>
                                <motion.circle
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
                                    animate={{
                                        strokeDasharray: segment.dashArray,
                                        strokeWidth: isActive ? thickness + 4 : thickness,
                                        opacity: hoveredSegment !== null && !isActive ? 0.5 : 1,
                                    }}
                                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                    className={cn(
                                        interactive && "cursor-pointer transition-all",
                                        isActive && "drop-shadow-lg"
                                    )}
                                    style={{
                                        filter: isActive ? `drop-shadow(0 0 8px ${segment.color}40)` : undefined,
                                    }}
                                    onMouseEnter={(e) => handleSegmentHover(index, e as any)}
                                    onMouseLeave={handleSegmentLeave}
                                    onClick={() => handleSegmentClick(segment, index)}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Center content */}
                {centerContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {centerContent}
                    </div>
                )}

                {/* Labels */}
                {showLabels && (
                    <div className="absolute -bottom-2 left-0 right-0 flex flex-wrap gap-2 justify-center mt-4">
                        {segments.map((segment, index) => (
                            <motion.div
                                key={index}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                                    interactive && "cursor-pointer",
                                    hoveredSegment === index && "bg-muted/50"
                                )}
                                whileHover={interactive ? { scale: 1.05 } : undefined}
                                onMouseEnter={(e) => handleSegmentHover(index, e as any)}
                                onMouseLeave={handleSegmentLeave}
                                onClick={() => handleSegmentClick(segment, index)}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: segment.color }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {segment.label} ({segment.percentage.toFixed(0)}%)
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tooltip */}
            {interactive && isVisible && tooltip && (
                <ChartTooltip visible={isVisible} x={tooltip.x} y={tooltip.y}>
                    <div className="text-xs space-y-1">
                        <p className="font-semibold text-foreground">{tooltip.content.label}</p>
                        <p className="text-muted-foreground">
                            Value: <span className="font-medium text-foreground">{tooltip.content.value.toLocaleString()}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Share: <span className="font-medium text-foreground">{tooltip.content.percentage.toFixed(1)}%</span>
                        </p>
                    </div>
                </ChartTooltip>
            )}
        </>
    );
}
