export interface Product {
  uid: string;
  name: string;
  quantity: number;
  category: string;
  description?: string;
  price?: number;
  isDone: boolean
}
