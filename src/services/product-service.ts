import type { Product } from '@/lib/types';

// In-memory array to mock a database
let products: Product[] = [
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
  { id: 'prod11', name: 'Whole Grain Pasta', description: 'A box of whole grain pasta.', price: 2.25, stock: 180, inStock: true, image: 'https://picsum.photos/seed/prod11/400/400' },
  { id: 'prod12', name: 'Tomato Sauce', description: 'A jar of organic tomato sauce.', price: 3.50, stock: 160, image: 'https://picsum.photos/seed/prod12/400/400' },
];

export class ProductService {
  // Using static methods because we are mocking a database, no instance state is needed.
  // In a real app, you might instantiate this with a database connection.

  static getProducts(): Product[] {
    // In a real app, this would fetch from a database or API
    return products;
  }

  static getProductById(id: string): Product | undefined {
    return products.find(p => p.id === id);
  }

  static async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: `prod${Date.now()}`, // Generate a unique ID
    };
    products.unshift(newProduct);
    return newProduct;
  }

  static async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return null;
    }
    const updatedProduct = { ...products[productIndex], ...productData };
    products[productIndex] = updatedProduct;
    return updatedProduct;
  }

  static async deleteProduct(id: string): Promise<void> {
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
      products.splice(productIndex, 1);
    }
  }
}
