"use client";

import { useEffect } from 'react';

// Use build timestamp for guaranteed cache busting on every build
const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || Date.now().toString();

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            // CRITICAL: Unregister ALL old service workers first
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                console.log('[SW] Found', registrations.length, 'existing registrations');

                registrations.forEach((registration) => {
                    console.log('[SW] Unregistering old SW:', registration.scope);
                    registration.unregister();
                });

                // Clear all caches
                if ('caches' in window) {
                    caches.keys().then((cacheNames) => {
                        console.log('[SW] Deleting', cacheNames.length, 'caches');
                        return Promise.all(
                            cacheNames.map((cacheName) => {
                                console.log('[SW] Deleting cache:', cacheName);
                                return caches.delete(cacheName);
                            })
                        );
                    }).then(() => {
                        console.log('[SW] All caches cleared, registering new SW');
                        registerNewServiceWorker();
                    });
                } else {
                    registerNewServiceWorker();
                }
            });
        }

        function registerNewServiceWorker() {
            // Add build timestamp to force SW update on every build
            const swUrl = `/sw.js?t=${BUILD_TIMESTAMP}`;

            navigator.serviceWorker
                .register(swUrl)
                .then((registration) => {
                    console.log('[SW] New Service Worker registered:', registration);
                    console.log('[SW] Build timestamp:', BUILD_TIMESTAMP);
                })
                .catch((error) => {
                    console.error('[SW] Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
