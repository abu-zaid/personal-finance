'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from './month-year-picker';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ExportDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (date: Date) => void;
    isExporting: boolean;
}

export function ExportDataDialog({
    open,
    onOpenChange,
    onExport,
    isExporting
}: ExportDataDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleExport = () => {
        onExport(selectedDate);
    };

    const Content = (
        <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                <div className="p-3 bg-white dark:bg-emerald-950/50 rounded-xl shadow-sm">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                    <p className="font-semibold text-sm">Excel Export</p>
                    <p className="text-xs opacity-90">Select a month to export your transaction history.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium pl-1 text-muted-foreground">Select Month</label>
                <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Export Data</DialogTitle>
                        <DialogDescription>
                            Download your monthly transaction report.
                        </DialogDescription>
                    </DialogHeader>
                    {Content}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isExporting ? 'Generating...' : 'Export Excel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-[2rem] pt-6 px-6 pb-8">
                <SheetHeader>
                    <SheetTitle>Export Data</SheetTitle>
                    <SheetDescription>
                        Download your monthly transaction report.
                    </SheetDescription>
                </SheetHeader>
                {Content}
                <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting} className="w-full">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isExporting ? 'Generating...' : 'Export Excel'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
