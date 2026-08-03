import type { TemplateItem } from '@/types';
import TemplateItemCard from '@/components/templates/TemplateItemCard';
import { getSortedCategoryGroups } from '@/utils/categories';

interface TemplateItemListProps {
  items: TemplateItem[];
}

// RN-12/13/14 — grouped by category in the fixed order, alphabetical
// within each group. Same shape as ProductList, minus isCompletedShop
// (template items have no completion state to branch on).
const TemplateItemList: React.FC<TemplateItemListProps> = ({ items }) => {
  const categoryGroups = getSortedCategoryGroups(items);

  return (
    <div className="w-full space-y-4">
      {categoryGroups.map(({ category, items: categoryItems }) => (
        <section key={category}>
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-tosho-700 mb-2">
            {category}
          </h3>

          <section className="space-y-2">
            {categoryItems.map((item) => (
              <TemplateItemCard key={item.uid} item={item} />
            ))}
          </section>
        </section>
      ))}
    </div>
  );
};

export default TemplateItemList;
