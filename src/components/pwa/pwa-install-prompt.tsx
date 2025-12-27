'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, WifiOff, Wifi } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showOfflineToast, setShowOfflineToast] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        // Check if already installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        if (isInstalled) return;

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) return;

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after a delay
            setTimeout(() => {
                setShowPrompt(true);
            }, 5000); // Show after 5 seconds
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Online/Offline detection
        const handleOnline = () => {
            setIsOnline(true);
            setSyncMessage('Back online! Syncing data...');
            setShowOfflineToast(true);

            // Request sync
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
            }

            setTimeout(() => setShowOfflineToast(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setSyncMessage('You\'re offline. Changes will sync when online.');
            setShowOfflineToast(true);
            setTimeout(() => setShowOfflineToast(false), 5000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for SW messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'OFFLINE_SAVE') {
                    setSyncMessage(event.data.message);
                    setShowOfflineToast(true);
                    setTimeout(() => setShowOfflineToast(false), 4000);
                } else if (event.data.type === 'SYNC_SUCCESS') {
                    setSyncMessage('Data synced successfully!');
                    setShowOfflineToast(true);
                    setTimeout(() => setShowOfflineToast(false), 3000);
                } else if (event.data.type === 'ONLINE') {
                    setSyncMessage(event.data.message);
                    setShowOfflineToast(true);
                    setTimeout(() => setShowOfflineToast(false), 3000);
                } else if (event.data.type === 'SW_UPDATED') {
                    // New version detected - show update toast
                    setSyncMessage('🎉 App updated! Refresh to see changes.');
                    setShowOfflineToast(true);

                    // Auto-reload after 2 seconds
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            });
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // hapticButton(); // Removed as haptic lib is not available
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            // hapticSuccess();
            setShowPrompt(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        // hapticButton();
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    return (
        <>
            {/* Install Prompt */}
            <AnimatePresence>
                {showPrompt && deferredPrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 md:max-w-md"
                    >
                        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/90 dark:to-blue-800/90 backdrop-blur-xl p-5 rounded-2xl">
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                                        Install App
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                                        Install for quick access and offline use!
                                    </p>

                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                                            <Zap className="w-4 h-4" />
                                            <span>Instant access from home screen</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                                            <WifiOff className="w-4 h-4" />
                                            <span>Works offline</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleInstall}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Install
                                        </Button>
                                        <Button
                                            onClick={handleDismiss}
                                            variant="outline"
                                            className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                                        >
                                            Later
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offline/Online Status Toast */}
            <AnimatePresence>
                {showOfflineToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <Card className={`border-0 shadow-2xl px-4 py-3 rounded-xl backdrop-blur-xl ${isOnline
                                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/90 dark:to-green-800/90'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/90 dark:to-amber-800/90'
                            }`}>
                            <div className="flex items-center gap-3">
                                {isOnline ? (
                                    <Wifi className="w-5 h-5 text-green-600 dark:text-green-300" />
                                ) : (
                                    <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                                )}
                                <p className={`text-sm font-medium ${isOnline
                                        ? 'text-green-700 dark:text-green-200'
                                        : 'text-amber-700 dark:text-amber-200'
                                    }`}>
                                    {syncMessage}
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Offline Indicator in Corner */}
            <AnimatePresence>
                {!isOnline && !showOfflineToast && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-4 right-4 z-40"
                    >
                        <div className="px-3 py-1.5 rounded-full bg-amber-500 dark:bg-amber-600 shadow-lg flex items-center gap-2">
                            <WifiOff className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-semibold text-white">Offline</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
