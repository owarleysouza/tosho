import { Beef, Carrot, Coffee, Cookie, ShoppingBasket, ShoppingCart, UtensilsCrossed } from 'lucide-react';

// A small fixed set (not free-form) — picking one is a lightweight visual
// touch, not something that needs unlimited choice.
export const TEMPLATE_ICONS = [
  { key: 'cart', icon: ShoppingCart },
  { key: 'basket', icon: ShoppingBasket },
  { key: 'carrot', icon: Carrot },
  { key: 'beef', icon: Beef },
  { key: 'grill', icon: UtensilsCrossed }, // churrasco/churrasqueira (print 13)
  { key: 'coffee', icon: Coffee },
  { key: 'cookie', icon: Cookie },
] as const;

export type TemplateIconKey = (typeof TEMPLATE_ICONS)[number]['key'];

export const DEFAULT_TEMPLATE_ICON: TemplateIconKey = 'cart';

// Falls back to the default for templates created before this existed
// (no `icon` field yet) or any unrecognized/legacy value.
export function getTemplateIcon(key?: string) {
  return TEMPLATE_ICONS.find((option) => option.key === key)?.icon ?? ShoppingCart;
}
