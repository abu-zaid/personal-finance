'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BatchActionsProps {
    isVisible: boolean;
    selectedCount: number;
    onClearSelection: () => void;
    onDelete: () => void;
}

export function BatchActions({ isVisible, selectedCount, onClearSelection, onDelete }: BatchActionsProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-50"
                >
                    <Card className="bg-popover text-popover-foreground border-border shadow-floating">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary">
                                        {selectedCount} selected
                                    </Badge>
                                    <p className="text-sm font-medium opacity-90 hidden sm:block">
                                        Select more or choose an action
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClearSelection}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={onDelete}
                                        className="gap-2 text-white hover:text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
