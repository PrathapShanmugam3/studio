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
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  wholesalePrice: z.coerce.number().min(0, "Wholesale price must be non-negative").optional(),
  retailPrice: z.coerce.number().min(0, "Retail price must be non-negative").optional(),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  image: z.string().url("Must be a valid image URL"),
  barcode: z.string().optional(),
  expiryDate: z.string().optional(),
});

export async function createProduct(formData: FormData) {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        // Handle validation errors
        console.error(validatedFields.error);
        return { error: "Invalid data" };
    }

    await ProductService.createProduct(validatedFields.data);
    
    revalidatePath('/admin/products');
    redirect('/admin/products');
}

export async function updateProduct(formData: FormData) {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success || !validatedFields.data.id) {
        console.error(validatedFields.error);
        return { error: "Invalid data" };
    }
    
    const { id, ...productData } = validatedFields.data;
    await ProductService.updateProduct(id, productData);

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/edit/${id}`);
    redirect('/admin/products');
}

export async function deleteProduct(formData: FormData) {
    const id = formData.get('productId') as string;
    await ProductService.deleteProduct(id);
    revalidatePath('/admin/products');
}
