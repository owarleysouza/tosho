import {
  FormField,
  FormControl,
  FormItem,
  FormMessage,
  FormDescription,
  FormLabel,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface FormFieldProps {
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  type?: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

const FormInput: React.FC<FormFieldProps> = ({
  label,
  formControl,
  name,
  placeholder,
  type,
  hint,
  icon,
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
          <FormControl>
            <div className="relative">
              {icon && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tosho-500">
                  {icon}
                </span>
              )}
              <Input
                placeholder={placeholder}
                type={type}
                className={`rounded-full ring-1 ring-accent focus-visible:ring-primary placeholder:text-tosho-200 ${icon ? 'pl-10' : ''}`}
                {...field}
              />
            </div>
          </FormControl>

          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default FormInput;
