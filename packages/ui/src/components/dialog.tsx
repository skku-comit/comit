"use client"

import { Dialog as Primitive } from "@base-ui/react/dialog"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function DialogTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={(state) =>
        cn("", typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  )
}
export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      className={(state) =>
        cn(
          "text-xl font-semibold",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={(state) =>
        cn(
          "text-sm leading-relaxed text-muted-foreground",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function DialogClose({
  className,
  ...props
}: ComponentProps<typeof Primitive.Close>) {
  return (
    <Primitive.Close
      className={(state) =>
        cn(
          "rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export const Dialog = Primitive.Root
export function DialogContent({
  children,
  className,
  ...props
}: ComponentProps<typeof Primitive.Popup>) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <Primitive.Popup
        className={(state) =>
          cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border bg-popover p-6 text-popover-foreground shadow-lg outline-none",
            typeof className === "function" ? className(state) : className
          )
        }
        {...props}
      >
        {children}
      </Primitive.Popup>
    </Primitive.Portal>
  )
}
