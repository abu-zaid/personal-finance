'use client';

import { useState, useCallback, useRef } from 'react';

interface TooltipData {
    x: number;
    y: number;
    content: any;
}

export function useChartTooltip() {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = useCallback((x: number, y: number, content: any) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setTooltip({ x, y, content });
    }, []);

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setTooltip(null);
        }, 100);
    }, []);

    const updateTooltip = useCallback((x: number, y: number, content: any) => {
        setTooltip({ x, y, content });
    }, []);

    return {
        tooltip,
        showTooltip,
        hideTooltip,
        updateTooltip,
        isVisible: tooltip !== null,
    };
}
