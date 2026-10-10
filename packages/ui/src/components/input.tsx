"use client"

import { Input as Primitive } from "@base-ui/react/input"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

function Input({ className, ...props }: ComponentProps<typeof Primitive>) {
  return (
    <Primitive
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}
export { Input }
