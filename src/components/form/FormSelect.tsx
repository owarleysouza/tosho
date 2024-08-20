import { Control } from "react-hook-form"
 
import { 
  FormControl, 
  FormField,
  FormItem, 
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" 

import { productCategories } from '@/utils/productCategories'; 

interface SelectFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
}

const FormSelect: React.FC<SelectFieldProps> = ({formControl, name, placeholder}) => {
 
  const productCategoriesEntries = Object.entries(productCategories)

  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="rounded-full ring-1 ring-accent focus:ring-primary">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="item-aligned">
              {
                productCategoriesEntries.map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)
              }
            </SelectContent>
          </Select>
          
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default FormSelect