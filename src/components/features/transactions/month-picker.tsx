"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
    currentDate: Date
    onDateChange: (date: Date) => void
    align?: "start" | "center" | "end"
    className?: string
}

export function MonthPicker({
    currentDate,
    onDateChange,
    align = "start",
    className
}: MonthPickerProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDateChange(subMonths(currentDate, 1))}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous month</span>
            </Button>
            <div className="font-medium text-sm min-w-[100px] text-center tabular-nums">
                {format(currentDate, "MMMM yyyy")}
            </div>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDateChange(addMonths(currentDate, 1))}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next month</span>
            </Button>
        </div>
    )
}
