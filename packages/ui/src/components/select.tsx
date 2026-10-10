"use client"

import { Select as Primitive } from "@base-ui/react/select"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function SelectTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={(state) =>
        cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-disabled:opacity-50",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function SelectItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={(state) =>
        cn(
          "relative cursor-default rounded px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-disabled:opacity-50",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export const Select = Primitive.Root
export const SelectValue = Primitive.Value
export function SelectContent({
  children,
  ...props
}: ComponentProps<typeof Primitive.Popup>) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner sideOffset={4} className="z-50">
        <Primitive.Popup
          className="max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          {...props}
        >
          <Primitive.List>{children}</Primitive.List>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  )
}
export const SelectItemText = Primitive.ItemText
