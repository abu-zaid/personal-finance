import { Skeleton } from '@/components/ui/skeleton';
import { Stack, Grid, Box } from '@/components/ui/layout';

export function DashboardSkeleton() {
    return (
        <Stack gap={6} className="p-4 md:p-6">
            {/* Hero Balance Card Skeleton */}
            <Box className="rounded-3xl bg-card border border-border p-6">
                <Stack gap={4}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-48" />
                    <Grid cols={2} gap={4} className="mt-4">
                        <Box>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-8 w-32" />
                        </Box>
                        <Box>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-8 w-32" />
                        </Box>
                    </Grid>
                </Stack>
            </Box>

            {/* Quick Stats Grid Skeleton */}
            <Grid cols={2} gap={4} className="md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Box key={i} className="rounded-2xl bg-card border border-border p-4">
                        <Skeleton className="h-3 w-16 mb-3" />
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-3 w-20" />
                    </Box>
                ))}
            </Grid>

            {/* Charts and Lists Grid */}
            <Grid cols={1} gap={6} className="md:grid-cols-2">
                {/* Spending Chart Skeleton */}
                <Box className="rounded-2xl bg-card border border-border p-6">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <Box className="flex items-end justify-between gap-2 h-48">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className="flex-1 rounded-t-md"
                                style={{ height: `${Math.random() * 60 + 40}%` }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Category Breakdown Skeleton */}
                <Box className="rounded-2xl bg-card border border-border p-6">
                    <Skeleton className="h-5 w-40 mb-4" />
                    <Stack gap={3}>
                        {[...Array(5)].map((_, i) => (
                            <Box key={i}>
                                <Box className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </Box>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Budget Overview Skeleton */}
                <Box className="rounded-2xl bg-card border border-border p-6">
                    <Skeleton className="h-5 w-32 mb-6" />
                    <Box className="flex justify-center mb-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                    </Box>
                    <Stack gap={2}>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </Stack>
                </Box>

                {/* Recent Activity Skeleton */}
                <Box className="rounded-2xl bg-card border border-border p-6">
                    <Skeleton className="h-5 w-36 mb-4" />
                    <Stack gap={3}>
                        {[...Array(5)].map((_, i) => (
                            <Box key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                <Box className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </Box>
                                <Skeleton className="h-5 w-16" />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Grid>
        </Stack>
    );
}
