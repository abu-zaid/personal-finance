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
        // Just listen for controllerchange and reload the page automatically
        let refreshing = false;

        const handleControllerChange = () => {
            if (!refreshing) {
                refreshing = true;
                console.log('New service worker activated, reloading page...');
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
