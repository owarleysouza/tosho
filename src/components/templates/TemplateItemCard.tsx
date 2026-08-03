import type { TemplateItem } from '@/types';

interface TemplateItemCardProps {
  item: TemplateItem;
}

// No checkbox — unlike ProductCard, a template item has no completion
// state (RN-20/RN-21: that's created fresh only once cloned into a
// purchase). Edit/delete icons come in HU-25/HU-26, same incremental path
// ProductCard took across HU-09/10/11.
const TemplateItemCard: React.FC<TemplateItemCardProps> = ({ item }) => {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
        {item.quantity && (
          <p className="text-xs font-medium text-primary">{item.quantity}</p>
        )}
        {item.description && (
          <p className="truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplateItemCard;
