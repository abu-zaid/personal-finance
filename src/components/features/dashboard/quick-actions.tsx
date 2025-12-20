'use client';

import Link from 'next/link';
import { Plus, Receipt, Target, TrendingUp, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickActions() {
    return (
        <Card className=\"border-border/40 shadow-sm\">
            < CardContent className =\"p-5\">
                < h3 className =\"text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4\">Quick Actions</h3>
                    < div className =\"grid grid-cols-2 gap-3\">
                        < Link href =\"/transactions\" className=\"block\">
                            < Button
    className =\"w-full h-auto flex-col gap-2 py-4 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all\"
    size =\"lg\"
        >
        <Plus className=\"h-6 w-6\" strokeWidth={2.5} />
            < span className =\"text-sm font-bold\">Add Transaction</span>
            </Button >
          </Link >

        <Link href=\"/transactions\" className=\"block\">
            < Button
    variant =\"outline\" 
    className =\"w-full h-auto flex-col gap-2 py-4 border-border/60 hover:bg-muted/50\"
    size =\"lg\"
        >
        <Receipt className=\"h-5 w-5\" strokeWidth={2} />
            < span className =\"text-sm font-semibold\">View All</span>
            </Button >
          </Link >

        <Link href=\"/budgets\" className=\"block\">
            < Button
    variant =\"outline\" 
    className =\"w-full h-auto flex-col gap-2 py-4 border-border/60 hover:bg-muted/50\"
    size =\"lg\"
        >
        <Target className=\"h-5 w-5\" strokeWidth={2} />
            < span className =\"text-sm font-semibold\">Set Budget</span>
            </Button >
          </Link >

        <Link href=\"/insights\" className=\"block\">
            < Button
    variant =\"outline\" 
    className =\"w-full h-auto flex-col gap-2 py-4 border-border/60 hover:bg-muted/50\"
    size =\"lg\"
        >
        <TrendingUp className=\"h-5 w-5\" strokeWidth={2} />
            < span className =\"text-sm font-semibold\">Insights</span>
            </Button >
          </Link >
        </div >
      </CardContent >
    </Card >
  );
}
