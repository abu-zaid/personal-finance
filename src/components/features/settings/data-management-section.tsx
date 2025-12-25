'use client';

import Link from 'next/link';
import { Tags, ChevronRight, Download, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DataManagementSectionProps {
    onExport: () => void;
    onLogout: () => void;
}

export function DataManagementSection({ onExport, onLogout }: DataManagementSectionProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">More</h3>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card overflow-hidden divide-y divide-border/50">
                {/* Categories */}
                <Link href="/settings/categories" className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                            <Tags className="w-4 h-4 text-foreground" />
                        </div>
                        <span className="font-medium text-sm">Manage Categories</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                {/* Export */}
                <button
                    onClick={onExport}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                            <Download className="w-4 h-4 text-foreground" />
                        </div>
                        <span className="font-medium text-sm">Export Data (Excel)</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full group-hover:bg-red-200 dark:group-hover:bg-red-900/40 transition-colors">
                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-medium text-sm text-red-600 dark:text-red-400">Sign Out</span>
                    </div>
                </button>
            </Card>
        </div>
    );
}
