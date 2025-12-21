import { format } from 'date-fns';

export function InsightsHeader() {
    return (
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
            <p className="text-muted-foreground">
                Financial analysis for {format(new Date(), 'MMMM yyyy')}
            </p>
        </div>
    );
}
