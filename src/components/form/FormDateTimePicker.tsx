import { useState } from 'react'
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Control } from "react-hook-form";

interface DateTimeFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  label?: string;
  placeholder: string;
}

// Combines the Calendar (date) and a native time input into a single local
// Date. react-day-picker returns dates at local midnight, and hours/minutes
// are only ever set with setHours (never through an ISO date-only string or
// UTC getters/setters), so the instant handed to Firestore is exactly what
// the user picked. Reading it back with Timestamp.toDate() + date-fns
// format() (which also reads local time) reproduces the same day/hour —
// this is what avoids the classic UTC off-by-one-day bug.
const FormDateTimePicker: React.FC<DateTimeFieldProps> = ({
  formControl,
  name,
  label,
  placeholder,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => {
        const selectedDate: Date | undefined = field.value

        function handleSelectDate(day: Date | undefined) {
          if (!day) return

          const combined = new Date(day)
          if (selectedDate) {
            combined.setHours(selectedDate.getHours(), selectedDate.getMinutes())
          } else {
            const now = new Date()
            combined.setHours(now.getHours(), now.getMinutes())
          }
          field.onChange(combined)
        }

        function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
          const [hours, minutes] = event.target.value.split(':').map(Number)
          const base = selectedDate ? new Date(selectedDate) : new Date()
          base.setHours(hours, minutes, 0, 0)
          field.onChange(base)
        }

        return (
          <FormItem className="flex flex-col">
            {label && (
              <FormLabel className="text-[11px] font-medium uppercase tracking-wide text-tosho-700">
                {label}
              </FormLabel>
            )}
            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal rounded-full ring-1 ring-accent hover:bg-transparent",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy '·' HH:mm")
                    ) : (
                      <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  initialFocus
                />
                <div className="border-t p-3">
                  <Input
                    type="time"
                    value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                    onChange={handleTimeChange}
                    disabled={!selectedDate}
                    className="rounded-full ring-1 ring-accent"
                  />
                </div>
              </PopoverContent>
            </Popover>

            <FormMessage className="text-xs" />
          </FormItem>
        )
      }}
    />
  )
}

export default FormDateTimePicker
