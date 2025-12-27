import { Skeleton } from '@/components/ui/skeleton';
import { Stack, Box } from '@/components/ui/layout';

export function TransactionsSkeleton() {
    return (
        <Stack gap={4} className="p-4">
            {/* Date Group Headers with Transactions */}
            {[...Array(3)].map((_, groupIndex) => (
                <Box key={groupIndex}>
                    {/* Date Header */}
                    <Box className="mb-3">
                        <Skeleton className="h-5 w-32" />
                    </Box>

                    {/* Transaction Cards */}
                    <Stack gap={2}>
                        {[...Array(4)].map((_, i) => (
                            <Box
                                key={i}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
                            >
                                {/* Category Icon */}
                                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

                                {/* Transaction Details */}
                                <Box className="flex-1 min-w-0">
                                    <Skeleton className="h-4 w-32 mb-1" />
                                    <Skeleton className="h-3 w-24" />
                                </Box>

                                {/* Amount */}
                                <Skeleton className="h-5 w-20 flex-shrink-0" />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
}
