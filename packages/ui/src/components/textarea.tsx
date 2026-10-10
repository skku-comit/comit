"use client"

import { Field } from "@base-ui/react/field"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <Field.Control
      render={<textarea {...props} />}
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
    />
  )
}
export { Textarea }
