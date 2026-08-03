export interface Product {
  uid: string;
  name: string;
  quantity?: string;
  category: string;
  description?: string;
  price?: number;
  isDone: boolean
}

// No `isDone`/`completed` field on purpose — a template item has no
// concept of completion, only a purchase item does (RN-20/RN-21: that
// state is created fresh when a template is cloned into a purchase).
export interface TemplateItem {
  uid: string;
  name: string;
  quantity?: string;
  category: string;
  description?: string;
}
