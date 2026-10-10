"use client"

import { Switch as Primitive } from "@base-ui/react/switch"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Switch({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(state) =>
        cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-primary data-disabled:opacity-50",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    >
      <Primitive.Thumb className="size-5 rounded-full bg-background shadow-sm transition-transform motion-reduce:transition-none data-checked:translate-x-5" />
      {children}
    </Primitive.Root>
  )
}
