export interface Product {
  uid: string;
  name: string;
  quantity?: string;
  category: string;
  description?: string;
  price?: number;
  isDone: boolean
}
