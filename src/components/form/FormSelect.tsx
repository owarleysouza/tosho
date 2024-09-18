import { Control } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { productCategories } from '@/data/productCategories';

interface SelectFieldProps {
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  hint?: string;
}

const FormSelect: React.FC<SelectFieldProps> = ({
  label,
  formControl,
  name,
  placeholder,
  hint,
}) => {
  const productCategoriesEntries = Object.entries(productCategories);

  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="rounded-full ring-1 ring-accent focus:ring-primary">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="item-aligned">
              {productCategoriesEntries.map(([value, name]) => (
                <SelectItem key={value} value={value}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormDescription>{hint}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormSelect;
