import { Skeleton } from '@/components/ui/skeleton';
import { Stack, Grid, Box } from '@/components/ui/layout';

export function BudgetsSkeleton() {
    return (
        <Stack gap={6} className="p-4 md:p-6">
            {/* Budget Hero Skeleton */}
            <Box className="rounded-3xl bg-card border border-border p-6">
                <Stack gap={4}>
                    <Skeleton className="h-6 w-40" />
                    <Grid cols={3} gap={4}>
                        <Box>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-8 w-24" />
                        </Box>
                        <Box>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-8 w-24" />
                        </Box>
                        <Box>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-8 w-24" />
                        </Box>
                    </Grid>
                    <Skeleton className="h-3 w-full rounded-full" />
                </Stack>
            </Box>

            {/* Budget List Skeleton */}
            <Stack gap={4}>
                <Skeleton className="h-6 w-48" />

                {[...Array(3)].map((_, i) => (
                    <Box key={i} className="rounded-2xl bg-card border border-border p-6">
                        <Stack gap={4}>
                            {/* Category Header */}
                            <Box className="flex items-center justify-between">
                                <Box className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Box>
                                        <Skeleton className="h-4 w-24 mb-1" />
                                        <Skeleton className="h-3 w-32" />
                                    </Box>
                                </Box>
                                <Skeleton className="h-6 w-16" />
                            </Box>

                            {/* Progress Bar */}
                            <Skeleton className="h-2 w-full rounded-full" />

                            {/* Stats */}
                            <Grid cols={2} gap={4}>
                                <Box>
                                    <Skeleton className="h-3 w-12 mb-1" />
                                    <Skeleton className="h-5 w-20" />
                                </Box>
                                <Box>
                                    <Skeleton className="h-3 w-16 mb-1" />
                                    <Skeleton className="h-5 w-20" />
                                </Box>
                            </Grid>
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Stack>
    );
}
