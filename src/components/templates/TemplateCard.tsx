import { getTemplateIcon } from '@/utils/templateIcons';

export interface TemplateCardData {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
}

interface TemplateCardProps {
  template: TemplateCardData;
}

// No edit/delete icons and no click-through yet — those belong to HU-27
// (editar informações), HU-28 (excluir) and HU-23-26 (gerenciar itens),
// none of which exist yet. This is a plain display card for now.
const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const itemsLabel = `${template.itemsCount ?? 0} ${
    template.itemsCount === 1 ? 'item' : 'itens'
  }`;
  const Icon = getTemplateIcon(template.icon);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tosho-50 text-tosho-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {template.name}
        </p>
        <p className="text-xs font-medium text-primary">{itemsLabel}</p>
        {template.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
