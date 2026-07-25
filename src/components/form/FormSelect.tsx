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

interface SelectFieldProps {
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  hint?: string;
  options: string[];
  className?: string;
}

const FormSelect: React.FC<SelectFieldProps> = ({
  label,
  formControl,
  name,
  placeholder,
  hint,
  options,
  className,
}) => {
  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="text-[11px] font-medium uppercase tracking-wide text-tosho-700">
              {label}
            </FormLabel>
          )}
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="rounded-full ring-1 ring-accent focus:ring-primary">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="item-aligned">
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default FormSelect;
