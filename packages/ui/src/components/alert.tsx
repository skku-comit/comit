import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

const variants = cva(
  "flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        info: "bg-info-subtle text-info",
        destructive: "bg-destructive-subtle text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
)
export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof variants>) {
  return (
    <div
      role="alert"
      className={cn(variants({ variant }), className)}
      {...props}
    />
  )
}
