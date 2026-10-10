"use client"

import { Checkbox as Primitive } from "@base-ui/react/checkbox"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Checkbox({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(state) =>
        cn(
          "flex size-5 shrink-0 items-center justify-center rounded border border-input bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:opacity-50",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    >
      <Primitive.Indicator aria-hidden>✓</Primitive.Indicator>
      {children}
    </Primitive.Root>
  )
}
