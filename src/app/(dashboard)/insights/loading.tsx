import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function InsightsLoading() {
    return (
        <div className="space-y-6 p-4 pb-24 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-48" />
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-full lg:w-[400px]" />

            {/* Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 mt-6">
                {/* Left Column (Main Stats) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Health Score Card */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-4 w-60" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metric Cards */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4 sm:p-6">
                                    <Skeleton className="h-4 w-20 mb-3" />
                                    <Skeleton className="h-8 w-24 mb-2" />
                                    <Skeleton className="h-3 w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Budget Overview */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-3 w-full mb-3" />
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Smart Insights) */}
                <div className="lg:col-span-5 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="h-32">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
