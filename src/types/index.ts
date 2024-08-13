export interface Product {
  uid: string;
  name: string;
  quantity: number;
  category: string;
  isDone: boolean
  description?: string;
  price?: number;
}
