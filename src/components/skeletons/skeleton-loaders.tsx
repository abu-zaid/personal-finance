import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TransactionSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-transparent bg-background/50">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[40%]" />
                <Skeleton className="h-3 w-[25%]" />
            </div>
            <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
            </div>
        </div>
    )
}

export function CardSkeleton() {
    return (
        <Card className="rounded-[2rem] border-none shadow-xl bg-card h-[300px] relative overflow-hidden">
            <CardContent className="p-8 lg:p-10 flex flex-col justify-center h-full space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            </CardContent>
        </Card>
    )
}

export function StatCardSkeleton() {
    return (
        <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-24" />
            </CardContent>
        </Card>
    )
}

export function RecurringSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    )
}

export function GoalSkeleton() {
    return (
        <Card className="overflow-hidden border-border/40 h-full">
            <CardContent className="p-5 flex flex-col h-full space-y-4">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="flex gap-1">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-[70%]" />
                    <Skeleton className="h-3 w-[40%]" />
                </div>
                <div className="mt-auto space-y-3 pt-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function BudgetSkeleton() {
    return (
        <div className="bg-white dark:bg-card p-4 rounded-3xl border shadow-sm space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
            <CardContent className="p-6 lg:p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-[200px] w-full rounded-2xl" />
                </div>
                <div className="h-px bg-border/50" />
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-[150px] w-[150px] rounded-full mx-auto" />
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
