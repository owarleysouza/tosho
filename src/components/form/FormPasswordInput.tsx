import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

interface FormPasswordInputProps {
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  name: string;
  placeholder: string;
  hint?: string;
  icon?: React.ReactNode;
}

const FormPasswordInput: React.FC<FormPasswordInputProps> = ({
  label,
  formControl,
  name,
  placeholder,
  hint,
  icon,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem>
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
                type={visible ? 'text' : 'password'}
                className={`rounded-full ring-1 ring-accent focus-visible:ring-primary placeholder:text-tosho-200 pr-10 ${icon ? 'pl-10' : ''}`}
                {...field}
              />
              <button
                type="button"
                onClick={() => setVisible((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tosho-500"
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </FormControl>

          <FormDescription className="text-xs">{hint}</FormDescription>

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default FormPasswordInput;
