import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

function EmptyState({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center",
        className
      )}
      {...props}
    />
  )
}
function EmptyStateTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="empty-state"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}
function EmptyStateDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state"
      className={cn(
        "max-w-md text-sm leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
export { EmptyState, EmptyStateTitle, EmptyStateDescription }
