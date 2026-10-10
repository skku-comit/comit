"use client"

import { Tabs as Primitive } from "@base-ui/react/tabs"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Tabs({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(state) =>
        cn(
          "flex flex-col gap-4",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function TabsList({
  className,
  ...props
}: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={(state) =>
        cn(
          "inline-flex w-fit gap-1 rounded-lg bg-muted p-1",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.Tab>) {
  return (
    <Primitive.Tab
      className={(state) =>
        cn(
          "rounded-md px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-background data-active:shadow-xs",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Panel>) {
  return (
    <Primitive.Panel
      className={(state) =>
        cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
