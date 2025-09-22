import type { Order } from './types';
import { format, subDays } from 'date-fns';
import { ProductService } from '@/services/product-service';

// Re-export products from the service to maintain a single source of truth
export const products = ProductService.getProducts();

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
  { date: format(subDays(new Date(), 6), 'MM/dd/yy'), sales: 4000 },
  { date: format(subDays(new Date(), 5), 'MM/dd/yy'), sales: 3000 },
  { date: format(subDays(new Date(), 4), 'MM/dd/yy'), sales: 2000 },
  { date: format(subDays(new Date(), 3), 'MM/dd/yy'), sales: 2780 },
  { date: format(subDays(new Date(), 2), 'MM/dd/yy'), sales: 1890 },
  { date: format(subDays(new Date(), 1), 'MM/dd/yy'), sales: 2390 },
  { date: format(new Date(), 'MM/dd/yy'), sales: 3490 },
];
