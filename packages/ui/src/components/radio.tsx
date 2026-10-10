"use client"

import { Radio as Primitive } from "@base-ui/react/radio"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Radio({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(state) =>
        cn(
          "flex size-5 items-center justify-center rounded-full border border-input outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-primary data-disabled:opacity-50",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    >
      <Primitive.Indicator className="size-2.5 rounded-full bg-primary" />
      {children}
    </Primitive.Root>
  )
}
