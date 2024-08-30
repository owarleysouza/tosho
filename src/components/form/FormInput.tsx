import { 
  FormField,
  FormControl,
    FormItem,
    FormMessage,
    FormDescription,
  } from "@/components/ui/form"

import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form";

interface FormFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  type?: string;
  hint?: string;
}


const FormInput: React.FC<FormFieldProps> = ({formControl, name, placeholder, type, hint }) => {
  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem>
          
          <FormControl>
            <Input placeholder={placeholder} type={type} className="rounded-full ring-1 ring-accent focus-visible:ring-primary" {...field} />
          </FormControl>

          <FormDescription>
            { hint }
          </FormDescription>
          
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}

export default FormInput
