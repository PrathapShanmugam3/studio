
import type { Product, ApiProduct } from '@/lib/types';
import { ApiService } from './api-service';

// Helper to check if a URL is valid
function isValidHttpUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}


// Helper to convert API product shape to our app's Product shape
function fromApiProduct(apiProduct: ApiProduct): Product {
  const image = isValidHttpUrl(apiProduct.image) 
    ? apiProduct.image 
    : `https://picsum.photos/seed/${apiProduct.id || 'placeholder'}/400/400`;

  return {
    ...apiProduct,
    id: String(apiProduct.id), // Ensure id is a string
    stock: apiProduct.qty,
    description: apiProduct.name, // Assuming name can be used as description
    image: image,
  };
}

// Helper to convert our app's Product shape to the API's shape for sending data
function toApiProduct(product: Partial<Product>): any {
    const apiPayload: any = { ...product };
    if (product.stock !== undefined) {
        apiPayload.qty = product.stock;
        delete apiPayload.stock;
    }
     // The API seems to require a description, but our form doesn't have one sometimes
    if (!apiPayload.description && apiPayload.name) {
        apiPayload.description = apiPayload.name;
    }
    // Convert id back to number for API calls if it exists
    if(apiPayload.id) {
        apiPayload.id = Number(apiPayload.id);
    }
    return apiPayload;
}


export class ProductService {
  static async getProducts(): Promise<Product[]> {
    const data = await ApiService.get<ApiProduct[]>('/all');
    return data.map(fromApiProduct);
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      const data = await ApiService.get<ApiProduct>(`/${id}`);
      return fromApiProduct(data);
    } catch (error) {
      console.error(`Failed to fetch product with id ${id}:`, error);
      return null;
    }
  }

  static async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const apiPayload = toApiProduct(productData);
    const data = await ApiService.post<ApiProduct>('/addProduct', apiPayload);
    return fromApiProduct(data);
  }

  static async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    const apiPayload = toApiProduct(productData);
    try {
      // The API expects the ID in the URL, not the body for updates.
      const data = await ApiService.put<ApiProduct>(`/update/${id}`, { ...apiPayload, id: undefined });
      return fromApiProduct(data);
    } catch (error) {
      console.error(`Failed to update product with id ${id}:`, error);
      return null;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      await ApiService.delete(`/delete/${id}`);
    } catch (error) {
      console.error(`Failed to delete product with id ${id}:`, error);
    }
  }
}
