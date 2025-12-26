'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export function UpdatePrompt() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !('serviceWorker' in navigator)
        ) {
            return;
        }

        // Check if there is already a waiting worker
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg?.waiting) {
                setWaitingWorker(reg.waiting);
            }
        });

        const handleStateChange = (registration: ServiceWorkerRegistration) => {
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
            }
        };

        // We need to poll or listen for new updates.
        // A simple way is to rely on the service worker lifecycle
        // implementation in 'ServiceWorkerRegistration' component usually handles registration,
        // but we can look for specific events if we had a more complex setup.
        // For now, let's assume standard SW registration behavior where browser detects update.

        // Actually, the ServiceWorkerRegistration component is just registering it.
        // We should add an event listener for 'updatefound' on the registration.
        // But since we can't easily get the specific registration instance from here without context,
        // we'll rely on a global listener or look up the registration again.

        const updateListener = () => {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) {
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setWaitingWorker(newWorker);
                                }
                            });
                        }
                    });
                }
            });
        }

        updateListener();

        // Also handle controller change (reload page when new SW takes over)
        let refreshing = false;
        const handleControllerChange = () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    useEffect(() => {
        if (waitingWorker) {
            toast('New version available', {
                description: 'Update to get the latest features and fixes.',
                duration: Infinity,
                action: (
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-primary text-primary-foreground border-none hover:bg-primary/90"
                        onClick={() => {
                            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                            setWaitingWorker(null);
                        }}
                    >
                        <RefreshCcw className="mr-2 h-3 w-3" />
                        Update
                    </Button>
                ),
                cancel: {
                    label: 'Dismiss',
                    onClick: () => setWaitingWorker(null),
                }
            });
        }
    }, [waitingWorker]);

    return null;
}
