import type { Product, Order } from './types';

export const products: Product[] = [
  { id: 'prod1', name: 'Organic Bananas', description: 'A bundle of fresh organic bananas.', price: 1.25, stock: 150, image: 'https://picsum.photos/seed/prod1/400/400' },
  { id: 'prod2', name: 'Organic Apples', description: 'Crisp and juicy organic red apples.', price: 2.50, stock: 200, image: 'https://picsum.photos/seed/prod2/400/400' },
  { id: 'prod3', name: 'Free-Range Eggs', description: 'A carton of 12 fresh, free-range eggs.', price: 4.50, stock: 100, image: 'https://picsum.photos/seed/prod3/400/400' },
  { id: 'prod4', name: 'Whole Wheat Bread', description: 'A loaf of freshly baked whole wheat bread.', price: 3.75, stock: 80, image: 'https://picsum.photos/seed/prod4/400/400' },
  { id: 'prod5', name: 'Organic Milk', description: 'A gallon of fresh organic milk.', price: 5.00, stock: 120, image: 'https://picsum.photos/seed/prod5/400/400' },
  { id: 'prod6', name: 'Cheddar Cheese', description: 'A block of sharp cheddar cheese.', price: 6.25, stock: 90, image: 'https://picsum.photos/seed/prod6/400/400' },
  { id: 'prod7', name: 'Organic Spinach', description: 'A bag of fresh, leafy green spinach.', price: 3.00, stock: 75, image: 'https://picsum.photos/seed/prod7/400/400' },
  { id: 'prod8', name: 'Vine Tomatoes', description: 'Ripe and juicy vine tomatoes.', price: 2.75, stock: 110, image: 'https://picsum.photos/seed/prod8/400/400' },
  { id: 'prod9', name: 'Organic Carrots', description: 'A bag of crunchy organic carrots.', price: 2.00, stock: 130, image: 'https://picsum.photos/seed/prod9/400/400' },
  { id: 'prod10', name: 'Black Beans', description: 'A can of organic black beans.', price: 1.50, stock: 250, image: 'https://picsum.photos/seed/prod10/400/400' },
  { id: 'prod11', name: 'Whole Grain Pasta', description: 'A box of whole grain pasta.', price: 2.25, stock: 180, image: 'https://picsum.photos/seed/prod11/400/400' },
  { id: 'prod12', name: 'Tomato Sauce', description: 'A jar of organic tomato sauce.', price: 3.50, stock: 160, image: 'https://picsum.photos/seed/prod12/400/400' },
];

export const orders: Order[] = [
    {
        id: 'ord1',
        customerName: 'John Doe',
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        total: 20.25,
        status: 'Completed',
        items: [
            { id: 'prod1', name: 'Organic Bananas', price: 1.25, quantity: 2, image: 'https://picsum.photos/seed/prod1/400/400' },
            { id: 'prod4', name: 'Whole Wheat Bread', price: 3.75, quantity: 1, image: 'https://picsum.photos/seed/prod4/400/400' },
            { id: 'prod5', name: 'Organic Milk', price: 5.00, quantity: 1, image: 'https://picsum.photos/seed/prod5/400/400' },
        ]
    },
    {
        id: 'ord2',
        customerName: 'Jane Smith',
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        total: 11.75,
        status: 'Completed',
        items: [
            { id: 'prod2', name: 'Organic Apples', price: 2.50, quantity: 3, image: 'https://picsum.photos/seed/prod2/400/400' },
            { id: 'prod7', name: 'Organic Spinach', price: 3.00, quantity: 1, image: 'https://picsum.photos/seed/prod7/400/400' },
        ]
    },
     {
        id: 'ord3',
        customerName: 'Sam Wilson',
        date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        total: 7.25,
        status: 'Pending',
        items: [
            { id: 'prod8', name: 'Vine Tomatoes', price: 2.75, quantity: 1, image: 'https://picsum.photos/seed/prod8/400/400' },
            { id: 'prod9', name: 'Organic Carrots', price: 2.00, quantity: 2, image: 'https://picsum.photos/seed/prod9/400/400' },
        ]
    }
];

export const salesData = [
  { date: new Date(new Date().setDate(new Date().getDate() - 6)).toLocaleDateString(), sales: 4000 },
  { date: new Date(new Date().setDate(new Date().getDate() - 5)).toLocaleDateString(), sales: 3000 },
  { date: new Date(new Date().setDate(new Date().getDate() - 4)).toLocaleDateString(), sales: 2000 },
  { date: new Date(new Date().setDate(new Date().getDate() - 3)).toLocaleDateString(), sales: 2780 },
  { date: new Date(new Date().setDate(new Date().getDate() - 2)).toLocaleDateString(), sales: 1890 },
  { date: new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString(), sales: 2390 },
  { date: new Date().toLocaleDateString(), sales: 3490 },
];
