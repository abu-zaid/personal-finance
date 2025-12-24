'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChartTooltip } from './tooltip';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import { BRAND_GRADIENT } from '@/lib/constants';

interface BarChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarChartDataPoint[];
    height?: number;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
    interactive?: boolean;
    onBarClick?: (dataPoint: BarChartDataPoint, index: number) => void;
    formatValue?: (value: number) => string;
    showValues?: boolean;
}

export function BarChart({
    data,
    height = 200,
    orientation = 'vertical',
    className,
    interactive = true,
    onBarClick,
    formatValue = (v) => v.toLocaleString(),
    showValues = false,
}: BarChartProps) {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const { tooltip, showTooltip, hideTooltip, isVisible } = useChartTooltip();

    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    const handleBarHover = useCallback((index: number, event: React.MouseEvent) => {
        if (!interactive) return;
        setHoveredBar(index);
        const bar = data[index];
        showTooltip(
            event.clientX,
            event.clientY,
            {
                label: bar.label,
                value: bar.value,
                formattedValue: formatValue(bar.value),
            }
        );
    }, [interactive, data, showTooltip, formatValue]);

    const handleBarLeave = useCallback(() => {
        if (!interactive) return;
        setHoveredBar(null);
        hideTooltip();
    }, [interactive, hideTooltip]);

    const handleBarClick = useCallback((bar: BarChartDataPoint, index: number) => {
        if (interactive && onBarClick) {
            onBarClick(bar, index);
        }
    }, [interactive, onBarClick]);

    if (data.length === 0) {
        return (
            <div
                className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)}
                style={{ height }}
            >
                <p className="text-xs text-muted-foreground">No data</p>
            </div>
        );
    }

    if (orientation === 'vertical') {
        return (
            <>
                <div className={cn("flex items-end justify-between gap-2", className)} style={{ height }}>
                    {data.map((bar, index) => {
                        const barHeight = (bar.value / maxValue) * 100;
                        const isHovered = hoveredBar === index;
                        const barColor = bar.color || BRAND_GRADIENT.from;

                        return (
                            <div
                                key={index}
                                className="flex-1 flex flex-col items-center gap-2"
                            >
                                <motion.div
                                    className={cn(
                                        "w-full rounded-t-lg transition-all relative overflow-hidden",
                                        interactive && "cursor-pointer"
                                    )}
                                    style={{
                                        height: `${barHeight}%`,
                                        backgroundColor: barColor,
                                        opacity: hoveredBar !== null && !isHovered ? 0.5 : 1,
                                        filter: isHovered ? `drop-shadow(0 0 8px ${barColor}40)` : undefined,
                                    }}
                                    initial={{ scaleY: 0 }}
                                    animate={{
                                        scaleY: 1,
                                        scale: isHovered ? 1.05 : 1,
                                    }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    onMouseEnter={(e) => handleBarHover(index, e)}
                                    onMouseLeave={handleBarLeave}
                                    onClick={() => handleBarClick(bar, index)}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />

                                    {/* Value label */}
                                    {showValues && barHeight > 15 && (
                                        <div className="absolute top-2 left-0 right-0 text-center">
                                            <span className="text-[10px] font-semibold text-[#101010]">
                                                {formatValue(bar.value)}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>

                                <span className={cn(
                                    "text-[10px] text-muted-foreground text-center truncate w-full",
                                    isHovered && "font-semibold text-foreground"
                                )}>
                                    {bar.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Tooltip */}
                {interactive && isVisible && tooltip && (
                    <ChartTooltip visible={isVisible} x={tooltip.x} y={tooltip.y}>
                        <div className="text-xs space-y-1">
                            <p className="font-semibold text-foreground">{tooltip.content.label}</p>
                            <p className="text-muted-foreground">
                                Value: <span className="font-medium text-foreground">{tooltip.content.formattedValue}</span>
                            </p>
                        </div>
                    </ChartTooltip>
                )}
            </>
        );
    }

    // Horizontal orientation
    return (
        <>
            <div className={cn("flex flex-col gap-3", className)}>
                {data.map((bar, index) => {
                    const barWidth = (bar.value / maxValue) * 100;
                    const isHovered = hoveredBar === index;
                    const barColor = bar.color || BRAND_GRADIENT.from;

                    return (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className={cn(
                                    "text-muted-foreground truncate",
                                    isHovered && "font-semibold text-foreground"
                                )}>
                                    {bar.label}
                                </span>
                                {showValues && (
                                    <span className="font-medium text-foreground ml-2">
                                        {formatValue(bar.value)}
                                    </span>
                                )}
                            </div>

                            <div className="h-8 bg-muted/20 rounded-lg overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full rounded-lg transition-all relative overflow-hidden",
                                        interactive && "cursor-pointer"
                                    )}
                                    style={{
                                        width: `${barWidth}%`,
                                        backgroundColor: barColor,
                                        opacity: hoveredBar !== null && !isHovered ? 0.5 : 1,
                                        filter: isHovered ? `drop-shadow(0 0 8px ${barColor}40)` : undefined,
                                    }}
                                    initial={{ scaleX: 0 }}
                                    animate={{
                                        scaleX: 1,
                                        scale: isHovered ? 1.02 : 1,
                                    }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    onMouseEnter={(e) => handleBarHover(index, e)}
                                    onMouseLeave={handleBarLeave}
                                    onClick={() => handleBarClick(bar, index)}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </motion.div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tooltip */}
            {interactive && isVisible && tooltip && (
                <ChartTooltip visible={isVisible} x={tooltip.x} y={tooltip.y}>
                    <div className="text-xs space-y-1">
                        <p className="font-semibold text-foreground">{tooltip.content.label}</p>
                        <p className="text-muted-foreground">
                            Value: <span className="font-medium text-foreground">{tooltip.content.formattedValue}</span>
                        </p>
                    </div>
                </ChartTooltip>
            )}
        </>
    );
}
