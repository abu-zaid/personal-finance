'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories';
import { Progress } from '@/components/ui/progress';

interface CategoryData {
    category: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
    total: number;
    count: number;
    prevTotal: number;
    change: number;
}

interface CategoryAnalysisProps {
    data: CategoryData[];
    totalCurrentMonth: number;
    formatCurrency: (value: number) => string;
}

export function CategoryAnalysis({ data, totalCurrentMonth, formatCurrency }: CategoryAnalysisProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
                <CardDescription>Where your money went this month</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {data.map((item) => {
                        const percentage = totalCurrentMonth > 0 ? (item.total / totalCurrentMonth) * 100 : 0;

                        return (
                            <div key={item.category.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CategoryIcon
                                            icon={item.category.icon}
                                            color={item.category.color}
                                            size="sm"
                                        />
                                        <div>
                                            <p className="font-medium text-sm leading-none">{item.category.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.count} transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{formatCurrency(item.total)}</p>
                                        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <Progress value={percentage} className="h-2"
                                // We'll let Shadcn handle the color, or custom style if needed
                                />
                            </div>
                        );
                    })}

                    {data.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No category data available.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
