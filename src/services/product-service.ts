
import type { Product, ApiProduct, ApiResponse } from '@/lib/types';
import { ApiService, ApiServiceError } from './api-service';

// Helper to check if a URL is valid
function isValidHttpUrl(string: string) {
  if (!string) return false;
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}


// Helper to convert API product shape to our app's Product shape
function fromApiProduct(apiProduct: any): Product {
  const image = isValidHttpUrl(apiProduct.image) 
    ? apiProduct.image 
    : `https://picsum.photos/seed/${apiProduct.id || 'placeholder'}/400/400`;

  return {
    id: String(apiProduct.id), // Ensure id is a string
    name: apiProduct.name,
    description: apiProduct.description || apiProduct.name,
    price: apiProduct.price,
    wholesalePrice: apiProduct.wholesalePrice || apiProduct.wholesale_price,
    retailPrice: apiProduct.retailPrice || apiProduct.retail_price,
    stock: apiProduct.qty,
    image: image,
    barcode: apiProduct.barcode,
    expiryDate: apiProduct.expiryDate || apiProduct.expiry_date,
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
    try {
      const response = await ApiService.get<ApiProduct[]>('/all');
      return response.responseContent.map(fromApiProduct);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Return an empty array to prevent the app from crashing.
      // The UI will show that no products are available.
      return [];
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await ApiService.get<ApiProduct>(`/${id}`);
      return fromApiProduct(response.responseContent);
    } catch (error) {
      if (error instanceof ApiServiceError && error.status === 404) {
        return null;
      }
      console.error(`Failed to fetch product with id ${id}:`, error);
      throw error;
    }
  }

  static async getProductsByBarcode(barcode: string): Promise<Product[]> {
    try {
      const cleanedBarcode = barcode.replace(/\\/g, '');
      const payload = {
        dataCode: "GET_PRODUCT_BY_CODE",
        placeholderKeyValueMap: {
          barCode: cleanedBarcode,
        },
      };
      // Use the new postCustom method that doesn't add the /api prefix
      const response = await ApiService.postCustom<any[]>('/customdata/getdata', payload);
      if (response.responseContent && Array.isArray(response.responseContent)) {
        return response.responseContent.map(fromApiProduct);
      }
      return [];
    } catch (error) {
        console.error('Failed to fetch products by barcode:', error);
        return [];
    }
  }

  static async createProduct(productData: Omit<Product, 'id'>): Promise<ApiResponse<ApiProduct>> {
    const apiPayload = toApiProduct(productData);
    const response = await ApiService.post<ApiProduct>('/addProduct', apiPayload);
    return response;
  }

  static async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<ApiResponse<ApiProduct>> {
    const apiPayload = toApiProduct(productData);
    try {
      const response = await ApiService.put<ApiProduct>(`/update/${id}`, { ...apiPayload, id: undefined });
      return response;
    } catch (error) {
      console.error(`Failed to update product with id ${id}:`, error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await ApiService.delete<null>(`/delete/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete product with id ${id}:`, error);
      throw error;
    }
  }
}
