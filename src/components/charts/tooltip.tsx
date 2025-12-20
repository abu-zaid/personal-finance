'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
    visible: boolean;
    x: number;
    y: number;
    children: ReactNode;
    className?: string;
    offset?: number;
}

export function ChartTooltip({
    visible,
    x,
    y,
    children,
    className,
    offset = 10,
}: TooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y });

    useEffect(() => {
        if (!visible || !tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y - rect.height - offset;

        // Adjust horizontal position if tooltip goes off-screen
        if (adjustedX + rect.width > viewportWidth - 10) {
            adjustedX = viewportWidth - rect.width - 10;
        }
        if (adjustedX < 10) {
            adjustedX = 10;
        }

        // Adjust vertical position if tooltip goes off top
        if (adjustedY < 10) {
            adjustedY = y + offset;
        }

        setPosition({ x: adjustedX, y: adjustedY });
    }, [visible, x, y, offset]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={cn(
                        'fixed z-50 pointer-events-none',
                        'px-3 py-2 rounded-xl',
                        'glass-card border border-border/50',
                        'shadow-lg',
                        className
                    )}
                    style={{
                        left: position.x,
                        top: position.y,
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
