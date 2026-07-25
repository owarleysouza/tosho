import { 
  FormField,
  FormControl,
    FormItem,
    FormMessage,
  } from "@/components/ui/form"

import { Textarea } from "@/components/ui/textarea"
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  className?: string;
}


const FormTextArea: React.FC<FormFieldProps> = ({formControl, name, placeholder, className}) => {
  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea placeholder={placeholder} className={cn("rounded-2xl ring-1 ring-accent focus-visible:ring-primary resize-none", className)} {...field} />
          </FormControl>

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}

export default FormTextArea
