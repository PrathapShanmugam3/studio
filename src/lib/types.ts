export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
};
