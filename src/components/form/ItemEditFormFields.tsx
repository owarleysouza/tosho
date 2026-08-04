import { Control } from 'react-hook-form';

import FormInput from '@/components/form/FormInput';
import FormSelect from '@/components/form/FormSelect';

// Shared by ProductEditDialog (HU-10) and TemplateItemEditDialog (HU-25) —
// same 4 fields, same order, same validation (ProductEditFormSchema is
// generic enough to serve both). Only the surrounding dialog (Firestore
// path, Redux vs local state) differs between the two.
interface ItemEditFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formControl: Control<any>;
  categoryOptions: string[];
}

const ItemEditFormFields: React.FC<ItemEditFormFieldsProps> = ({
  formControl,
  categoryOptions,
}) => {
  return (
    <>
      <FormInput
        formControl={formControl}
        name="name"
        label="Nome"
        placeholder="Nome do produto"
        className="space-y-1"
      />

      <FormInput
        formControl={formControl}
        name="quantity"
        label="Quantidade"
        placeholder="2 unidades, 500g..."
        className="space-y-1"
      />

      <FormSelect
        formControl={formControl}
        name="category"
        label="Categoria"
        placeholder="Categoria"
        options={categoryOptions}
        className="space-y-1"
      />

      <FormInput
        formControl={formControl}
        name="description"
        label="Descrição"
        placeholder="Descrição ou observação do produto"
        className="space-y-1"
      />
    </>
  );
};

export default ItemEditFormFields;
