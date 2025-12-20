'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ShortcutAction = () => void;

interface ShortcutMap {
    [key: string]: ShortcutAction;
}

export const useShortcuts = (customShortcuts: ShortcutMap = {}) => {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Handle simple shortcuts
            if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                if (customShortcuts['n']) {
                    customShortcuts['n']();
                } else {
                    // Default: open new transaction modal (usually handled by a global state or custom logic)
                    // For now, we'll just navigate to transactions if not special logic
                    router.push('/transactions?action=new');
                }
            }

            if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Handle "Go to" shortcuts (g + key)
            // This requires state for tracking the 'g' key, but for simplicity we can use a small delay 
            // or just handle single keys for now. 
            // Let's implement g + key using a simple sequence tracker.
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, customShortcuts]);
};

// Advanced version with sequence tracking (e.g., 'g' then 'd')
export const useSequenceShortcuts = () => {
    const router = useRouter();

    useEffect(() => {
        let lastKey = '';
        let lastKeyTime = 0;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            const key = event.key.toLowerCase();
            const now = Date.now();

            // Clear sequence if too much time passed (500ms)
            if (now - lastKeyTime > 500) {
                lastKey = '';
            }

            if (lastKey === 'g') {
                event.preventDefault();
                switch (key) {
                    case 'd': router.push('/dashboard'); break;
                    case 't': router.push('/transactions'); break;
                    case 'b': router.push('/budgets'); break;
                    case 'i': router.push('/insights'); break;
                    case 's': router.push('/settings'); break;
                }
                lastKey = '';
            } else if (key === 'g') {
                lastKey = 'g';
                lastKeyTime = now;
            } else if (key === 'n') {
                // Global 'n' for new transaction is handled in the components usually
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
};
