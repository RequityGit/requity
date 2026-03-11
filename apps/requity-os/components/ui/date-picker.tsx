"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /** Value as ISO date string (YYYY-MM-DD) or empty string */
  value: string
  /** Callback with ISO date string (YYYY-MM-DD) or empty string */
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Show month/year dropdown navigation (useful for date of birth, etc.) */
  showYearNavigation?: boolean
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  showYearNavigation,
  fromYear = 1920,
  toYear = new Date().getFullYear(),
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const date = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      onChange(format(selected, "yyyy-MM-dd"))
    } else {
      onChange("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {date ? (
            <span className="num">{format(date, "MMM d, yyyy")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          initialFocus
          {...(showYearNavigation && {
            captionLayout: "dropdown" as const,
            startMonth: new Date(fromYear, 0),
            endMonth: new Date(toYear, 11),
          })}
        />
      </PopoverContent>
    </Popover>
  )
}
