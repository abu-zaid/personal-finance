'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChartTooltip } from './tooltip';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';

interface LineChartDataPoint {
    label: string;
    value: number;
}

interface LineChartSeries {
    name: string;
    data: LineChartDataPoint[];
    color: string;
}

interface LineChartProps {
    series: LineChartSeries[];
    height?: number;
    className?: string;
    interactive?: boolean;
    showGrid?: boolean;
    showDots?: boolean;
    formatValue?: (value: number) => string;
    onPointClick?: (seriesIndex: number, pointIndex: number, value: number) => void;
}

export function LineChart({
    series,
    height = 200,
    className,
    interactive = true,
    showGrid = true,
    showDots = true,
    formatValue = (v) => v.toLocaleString(),
    onPointClick,
}: LineChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<{ seriesIndex: number; pointIndex: number } | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
    const { tooltip, showTooltip, hideTooltip, isVisible } = useChartTooltip();

    const { maxValue, minValue, chartData } = useMemo(() => {
        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const maxValue = Math.max(...allValues, 1);
        const minValue = Math.min(...allValues, 0);
        const range = maxValue - minValue || 1;

        const chartData = series.map(s => {
            const points = s.data.map((point, index) => {
                const x = (index / (s.data.length - 1 || 1)) * 100;
                const y = height - ((point.value - minValue) / range) * (height - 20);
                return { x, y, value: point.value, label: point.label };
            });

            const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
            const areaData = `${pathData} L 100,${height} L 0,${height} Z`;

            return { ...s, points, pathData, areaData };
        });

        return { maxValue, minValue, chartData };
    }, [series, height]);

    const handlePointHover = useCallback((seriesIndex: number, pointIndex: number, event: React.MouseEvent<SVGElement>) => {
        if (!interactive) return;
        setHoveredPoint({ seriesIndex, pointIndex });
        const point = chartData[seriesIndex].points[pointIndex];
        const rect = event.currentTarget.getBoundingClientRect();
        showTooltip(
            rect.left + (point.x / 100) * rect.width,
            rect.top,
            {
                seriesName: chartData[seriesIndex].name,
                label: point.label,
                value: point.value,
                formattedValue: formatValue(point.value),
                color: chartData[seriesIndex].color,
            }
        );
    }, [interactive, chartData, showTooltip, formatValue]);

    const handleMouseLeave = useCallback(() => {
        if (!interactive) return;
        setHoveredPoint(null);
        hideTooltip();
    }, [interactive, hideTooltip]);

    const handlePointClick = useCallback((seriesIndex: number, pointIndex: number, value: number) => {
        if (interactive && onPointClick) {
            onPointClick(seriesIndex, pointIndex, value);
        }
    }, [interactive, onPointClick]);

    const handleSeriesClick = useCallback((seriesIndex: number) => {
        if (!interactive) return;
        setSelectedSeries(prev => prev === seriesIndex ? null : seriesIndex);
    }, [interactive]);

    if (series.length === 0 || series.every(s => s.data.length === 0)) {
        return (
            <div
                className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)}
                style={{ height }}
            >
                <p className="text-xs text-muted-foreground">No data</p>
            </div>
        );
    }

    // Grid lines
    const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1] : [];

    return (
        <>
            <div className={cn("relative", className)}>
                <svg
                    viewBox={`0 0 100 ${height}`}
                    className="w-full"
                    style={{ height }}
                    preserveAspectRatio="none"
                    onMouseLeave={handleMouseLeave}
                >
                    <defs>
                        {chartData.map((s, index) => (
                            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
                            </linearGradient>
                        ))}
                    </defs>

                    {/* Grid lines */}
                    {gridLines.map((ratio, index) => (
                        <line
                            key={index}
                            x1="0"
                            y1={height - ratio * (height - 20)}
                            x2="100"
                            y2={height - ratio * (height - 20)}
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-muted/20"
                            strokeDasharray="2,2"
                        />
                    ))}

                    {/* Area fills */}
                    {chartData.map((s, seriesIndex) => {
                        const isSelected = selectedSeries === null || selectedSeries === seriesIndex;
                        return (
                            <motion.path
                                key={`area-${seriesIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isSelected ? 0.3 : 0.1 }}
                                transition={{ duration: 0.5 }}
                                d={s.areaData}
                                fill={`url(#gradient-${seriesIndex})`}
                            />
                        );
                    })}

                    {/* Lines */}
                    {chartData.map((s, seriesIndex) => {
                        const isSelected = selectedSeries === null || selectedSeries === seriesIndex;
                        const isHovered = hoveredPoint?.seriesIndex === seriesIndex;
                        return (
                            <motion.path
                                key={`line-${seriesIndex}`}
                                initial={{ pathLength: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: isSelected ? 1 : 0.3,
                                    strokeWidth: isHovered ? 3 : 2,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                d={s.pathData}
                                fill="none"
                                stroke={s.color}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    filter: isHovered ? `drop-shadow(0 0 6px ${s.color}80)` : undefined,
                                }}
                            />
                        );
                    })}

                    {/* Interactive dots */}
                    {chartData.map((s, seriesIndex) => {
                        const isSelected = selectedSeries === null || selectedSeries === seriesIndex;
                        return s.points.map((point, pointIndex) => {
                            const isHovered = hoveredPoint?.seriesIndex === seriesIndex && hoveredPoint?.pointIndex === pointIndex;
                            const shouldShow = showDots || isHovered;

                            return shouldShow ? (
                                <g key={`point-${seriesIndex}-${pointIndex}`}>
                                    {/* Invisible larger circle for easier hovering */}
                                    {interactive && (
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r="8"
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={(e) => handlePointHover(seriesIndex, pointIndex, e)}
                                            onClick={() => handlePointClick(seriesIndex, pointIndex, point.value)}
                                        />
                                    )}
                                    {/* Visible dot */}
                                    <motion.circle
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: isHovered ? 1.8 : 1,
                                            opacity: isSelected ? 1 : 0.5,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        cx={point.x}
                                        cy={point.y}
                                        r="3"
                                        fill={s.color}
                                        stroke="white"
                                        strokeWidth="1.5"
                                        className="pointer-events-none"
                                        style={{
                                            filter: isHovered ? `drop-shadow(0 0 6px ${s.color})` : undefined,
                                        }}
                                    />
                                </g>
                            ) : null;
                        });
                    })}

                    {/* Crosshair on hover */}
                    {interactive && hoveredPoint !== null && (
                        <motion.line
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            x1={chartData[hoveredPoint.seriesIndex].points[hoveredPoint.pointIndex].x}
                            y1="0"
                            x2={chartData[hoveredPoint.seriesIndex].points[hoveredPoint.pointIndex].x}
                            y2={height}
                            stroke={chartData[hoveredPoint.seriesIndex].color}
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    )}
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                    {chartData.map((s, index) => {
                        const isSelected = selectedSeries === null || selectedSeries === index;
                        return (
                            <motion.button
                                key={index}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1 rounded-md transition-all text-xs",
                                    interactive && "cursor-pointer hover:bg-muted/50",
                                    !isSelected && "opacity-40"
                                )}
                                whileHover={interactive ? { scale: 1.05 } : undefined}
                                onClick={() => handleSeriesClick(index)}
                            >
                                <div
                                    className="w-3 h-0.5 rounded-full"
                                    style={{ backgroundColor: s.color }}
                                />
                                <span className="font-medium">{s.name}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {interactive && isVisible && tooltip && (
                <ChartTooltip visible={isVisible} x={tooltip.x} y={tooltip.y}>
                    <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: tooltip.content.color }}
                            />
                            <p className="font-semibold text-foreground">{tooltip.content.seriesName}</p>
                        </div>
                        <p className="text-muted-foreground">{tooltip.content.label}</p>
                        <p className="font-bold text-foreground text-sm">
                            {tooltip.content.formattedValue}
                        </p>
                    </div>
                </ChartTooltip>
            )}
        </>
    );
}
