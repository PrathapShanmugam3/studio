'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { products } from './data'; // In a real app, this would be a database import.

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
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  image: z.string().url("Must be a valid image URL"),
});

export async function createProduct(formData: FormData) {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        // Handle validation errors
        console.error(validatedFields.error);
        return { error: "Invalid data" };
    }

    const newProduct = {
        ...validatedFields.data,
        id: `prod${Date.now()}`, // Generate a unique ID
    };

    products.unshift(newProduct); // Add to the start of the array
    
    revalidatePath('/admin/products');
    redirect('/admin/products');
}

export async function updateProduct(formData: FormData) {
    const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success || !validatedFields.data.id) {
        console.error(validatedFields.error);
        return { error: "Invalid data" };
    }

    const { id, ...updatedData } = validatedFields.data;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return { error: "Product not found" };
    }

    products[productIndex] = { ...products[productIndex], ...updatedData };

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/edit/${id}`);
    redirect('/admin/products');
}

export async function deleteProduct(formData: FormData) {
    const id = formData.get('productId') as string;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
        products.splice(productIndex, 1);
    }

    revalidatePath('/admin/products');
}
