import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      role="region"
      aria-label="표 가로 스크롤 영역"
      tabIndex={0}
      className="w-full overflow-x-auto rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}
export function TableHeader(props: ComponentProps<"thead">) {
  return <thead className="border-b bg-muted/50" {...props} />
}
export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />
}
export function TableRow(props: ComponentProps<"tr">) {
  return <tr className="border-b last:border-0 hover:bg-muted/50" {...props} />
}
export function TableHead(props: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className="h-11 px-4 text-left font-medium whitespace-nowrap"
      {...props}
    />
  )
}
export function TableCell(props: ComponentProps<"td">) {
  return <td className="px-4 py-3" {...props} />
}
export function TableCaption(props: ComponentProps<"caption">) {
  return <caption className="mt-4 text-muted-foreground" {...props} />
}
