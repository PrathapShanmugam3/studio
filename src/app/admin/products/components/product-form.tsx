'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';
import { createProduct, updateProduct } from '@/lib/actions';

const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  stock: z.coerce.number().int().min(0, 'Stock must be a non-negative integer'),
  image: z.string().url('Must be a valid image URL'),
});

type ProductFormData = z.infer<typeof ProductSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      stock: product?.stock || 0,
      image: product?.image || 'https://picsum.photos/seed/new-product/400/400',
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    if (product) {
      formData.append('id', product.id);
      await updateProduct(formData);
    } else {
      await createProduct(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            type="button"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 font-headline">
            {product ? 'Edit Product' : 'Add New Product'}
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => router.push('/admin/products')}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Fill in the details for your product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" step="0.01" {...register('price')} />
                    {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                 </div>
                 <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" {...register('stock')} />
                    {errors.stock && (
                    <p className="text-sm text-destructive">{errors.stock.message}</p>
                    )}
                 </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" {...register('image')} />
                {errors.image && (
                  <p className="text-sm text-destructive">{errors.image.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" type='button' onClick={() => router.push('/admin/products')}>Cancel</Button>
            <Button size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
        </div>
      </div>
    </form>
  );
}
