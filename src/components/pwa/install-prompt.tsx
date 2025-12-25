"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        );

        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (isStandalone) {
        return null; // Don't show if already installed
    }

    if (isIOS && !isStandalone) {
        // Optional: specific iOS instructions could go here, or just return null for now to keep it simple as per plan
        return null;
    }

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
            <div className="flex items-center justify-between rounded-lg border bg-background p-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Install FinanceFlow</h3>
                        <p className="text-sm text-muted-foreground">
                            Add to home screen for faster access
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleInstallClick}>
                        Install
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
