"use client"

import { RadioGroup as Primitive } from "@base-ui/react/radio-group"
import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof Primitive>) {
  return (
    <Primitive
      className={(state) =>
        cn(
          "flex flex-col gap-3",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}

export { Radio } from "./radio"
