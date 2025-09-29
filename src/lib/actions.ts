'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ProductService } from '@/services/product-service';

export async function login(formData: FormData) {
  // Mock authentication logic
  const email = formData.get('email');
  if (email === 'admin@example.com') {
    redirect('/admin/dashboard');
  }
  redirect('/products');
}

export async function register(formData: FormData) {
  // Mock registration logic
  redirect('/');
}

export async function logout() {
  redirect('/');
}

export async function placeOrder(cartItems: any) {
    // Mock order placement
    console.log("Order placed:", cartItems);
    // In a real app, you would save the order to a database.
    redirect('/checkout');
}

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  wholesalePrice: z.coerce.number().min(0, "Wholesale price must be non-negative").optional(),
  retailPrice: z.coerce.number().min(0, "Retail price must be non-negative").optional(),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  image: z.string().url("Must be a valid image URL"),
  barcode: z.string().optional(),
  expiryDate: z.string().optional(),
});

type ActionResult = {
    success: boolean;
    message?: string | null;
    error?: string;
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error(validatedFields.error);
        return { success: false, error: "Invalid data submitted." };
    }

    // Sanitize barcode value
    if (validatedFields.data.barcode) {
        validatedFields.data.barcode = validatedFields.data.barcode.replace(/\\/g, '');
    }

    try {
        const productData = {
            ...validatedFields.data,
            description: validatedFields.data.description || validatedFields.data.name,
        }
        const result = await ProductService.createProduct(productData);
        revalidatePath('/admin/products');
        return { success: true, message: result.message };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to create product." };
    }
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success || !validatedFields.data.id) {
        console.error(validatedFields.error);
        return { success: false, error: "Invalid data for update." };
    }
    
    // Sanitize barcode value
    if (validatedFields.data.barcode) {
        validatedFields.data.barcode = validatedFields.data.barcode.replace(/\\/g, '');
    }

    try {
        const { id, ...productData } = validatedFields.data;
        const result = await ProductService.updateProduct(id, productData);
        revalidatePath('/admin/products');
        revalidatePath(`/admin/products/edit/${id}`);
        return { success: true, message: result.message };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to update product." };
    }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
    if (!productId) {
        return { success: false, error: "Product ID is missing." };
    }
    try {
        const result = await ProductService.deleteProduct(productId);
        revalidatePath('/admin/products');
        return { success: true, message: result.message };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to delete product." };
    }
}
