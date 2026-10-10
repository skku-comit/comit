"use client"

import { Field as Primitive } from "@base-ui/react/field"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Field({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(state) =>
        cn(
          "flex flex-col gap-2",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      className={(state) =>
        cn(
          "text-sm font-medium",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={(state) =>
        cn(
          "text-sm text-muted-foreground",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function FieldError({
  className,
  ...props
}: ComponentProps<typeof Primitive.Error>) {
  return (
    <Primitive.Error
      className={(state) =>
        cn(
          "text-sm text-destructive",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
