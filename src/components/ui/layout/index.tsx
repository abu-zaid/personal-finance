import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ==========================================
// Box
// ==========================================
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
    ({ className, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "div"
        return (
            <Comp
                ref={ref}
                className={cn(className)}
                {...props}
            />
        )
    }
)
Box.displayName = "Box"

// ==========================================
// Stack (Vertical Flex)
// ==========================================
const stackVariants = cva(
    "flex flex-col",
    {
        variants: {
            gap: {
                0: "gap-0",
                1: "gap-1",
                2: "gap-2",
                3: "gap-3",
                4: "gap-4",
                5: "gap-5",
                6: "gap-6",
                8: "gap-8",
                10: "gap-10",
                12: "gap-12",
            },
            align: {
                start: "items-start",
                center: "items-center",
                end: "items-end",
                stretch: "items-stretch",
                baseline: "items-baseline",
            },
            justify: {
                start: "justify-start",
                center: "justify-center",
                end: "justify-end",
                between: "justify-between",
            }
        },
        defaultVariants: {
            gap: 4,
            align: "stretch",
            justify: "start",
        },
    }
)

export interface StackProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
    asChild?: boolean
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
    ({ className, gap, align, justify, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "div"
        return (
            <Comp
                ref={ref}
                className={cn(stackVariants({ gap, align, justify }), className)}
                {...props}
            />
        )
    }
)
Stack.displayName = "Stack"

// ==========================================
// Group (Horizontal Flex)
// ==========================================
const groupVariants = cva(
    "flex flex-row",
    {
        variants: {
            gap: {
                0: "gap-0",
                1: "gap-1",
                2: "gap-2",
                3: "gap-3",
                4: "gap-4",
                5: "gap-5",
                6: "gap-6",
                8: "gap-8",
                10: "gap-10",
                12: "gap-12",
            },
            align: {
                start: "items-start",
                center: "items-center",
                end: "items-end",
                stretch: "items-stretch",
                baseline: "items-baseline",
            },
            justify: {
                start: "justify-start",
                center: "justify-center",
                end: "justify-end",
                between: "justify-between",
                around: "justify-around",
            },
            wrap: {
                nowrap: "flex-nowrap",
                wrap: "flex-wrap",
            }
        },
        defaultVariants: {
            gap: 4,
            align: "center",
            justify: "start",
            wrap: "nowrap",
        },
    }
)

export interface GroupProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof groupVariants> {
    asChild?: boolean
}

const Group = React.forwardRef<HTMLDivElement, GroupProps>(
    ({ className, gap, align, justify, wrap, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "div"
        return (
            <Comp
                ref={ref}
                className={cn(groupVariants({ gap, align, justify, wrap }), className)}
                {...props}
            />
        )
    }
)
Group.displayName = "Group"

// ==========================================
// Grid
// ==========================================
const gridVariants = cva(
    "grid",
    {
        variants: {
            gap: {
                0: "gap-0",
                1: "gap-1",
                2: "gap-2",
                3: "gap-3",
                4: "gap-4",
                5: "gap-5",
                6: "gap-6",
                8: "gap-8",
                10: "gap-10",
            },
            cols: {
                1: "grid-cols-1",
                2: "grid-cols-2",
                3: "grid-cols-3",
                4: "grid-cols-4",
                5: "grid-cols-5",
                6: "grid-cols-6",
                12: "grid-cols-12",
            },
        },
        defaultVariants: {
            gap: 4,
            cols: 1,
        },
    }
)

export interface GridProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
    asChild?: boolean
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
    ({ className, gap, cols, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "div"
        return (
            <Comp
                ref={ref}
                className={cn(gridVariants({ gap, cols }), className)}
                {...props}
            />
        )
    }
)
Grid.displayName = "Grid"

export { Box, Stack, Group, Grid }
