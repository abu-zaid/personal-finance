'use client';

import { useEffect } from 'react';

export function UpdatePrompt() {
    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !('serviceWorker' in navigator)
        ) {
            return;
        }

        // With skipWaiting enabled in build-sw.js, new SW activates immediately
        // Force HARD reload to clear all cached JS/CSS
        let refreshing = false;

        const handleControllerChange = () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[UPDATE] New service worker activated, forcing HARD reload...');
                // Force hard reload to bypass all caches
                window.location.reload();
            }
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    return null;
}
