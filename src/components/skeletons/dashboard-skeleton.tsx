'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton, TransactionListSkeleton } from '@/components/shared/loading-skeleton';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between py-4 px-2">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    {/* Main Balance Card Setup */}
                    <div className="relative rounded-[2rem] border bg-card p-8 lg:p-10 h-[300px] flex flex-col justify-center gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-12 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                        <div className="rounded-[2rem] border p-6 lg:p-8 space-y-8">
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-64 w-full rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <div className="h-48 w-full flex items-center justify-center">
                                    <Skeleton className="h-40 w-40 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Content Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <TransactionListSkeleton count={5} />
                    </div>
                </div>
            </div>
        </div>
    );
}
