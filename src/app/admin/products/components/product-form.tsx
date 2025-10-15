'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useEffect, useRef } from 'react';

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
import { useToast } from '@/hooks/use-toast';

const ProductFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  wholesalePrice: z.coerce.number().min(0, "Wholesale price must be non-negative").optional(),
  retailPrice: z.coerce.number().min(0, "Retail price must be non-negative").optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be a non-negative integer'),
  image: z.string().url('Must be a valid image URL'),
  barcode: z.string().optional(),
  expiryDate: z.string().optional(),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      wholesalePrice: product?.wholesalePrice || 0,
      retailPrice: product?.retailPrice || 0,
      stock: product?.stock || 0,
      image: product?.image || 'https://picsum.photos/seed/new-product/400/400',
      barcode: product?.barcode || '',
      expiryDate: product?.expiryDate ? format(parseISO(product.expiryDate), 'yyyy-MM-dd') : '',
    },
  });
  
  useEffect(() => {
    const checkBarcode = () => {
      const params = new URLSearchParams(window.location.search);
      const scannedBarcode = params.get('barcode');
      if (scannedBarcode) {
        alert(`Scanned Barcode: ${scannedBarcode}`);
        setValue('barcode', scannedBarcode, { shouldValidate: true });

        // Clean up the URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('barcode');
        window.history.replaceState({}, '', currentUrl.toString());

        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Check immediately on load
    checkBarcode();
    
    // Start polling if not already
    if (!intervalRef.current) {
        intervalRef.current = setInterval(checkBarcode, 500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setValue]);


  const openExternalScanner = () => {
      const returnUrl = encodeURIComponent(window.location.href.split('?')[0]);
      window.location.href = `microbizscanner://scan?returnUrl=${returnUrl}`;
  };


  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    // Manually build formData to ensure correct types and format
    formData.append('name', data.name);
    if(data.description) formData.append('description', data.description);
    formData.append('price', String(data.price));
    formData.append('stock', String(data.stock));
    formData.append('image', data.image);
    if (data.wholesalePrice) formData.append('wholesalePrice', String(data.wholesalePrice));
    if (data.retailPrice) formData.append('retailPrice', String(data.retailPrice));
    if (data.barcode) formData.append('barcode', data.barcode);
    if (data.expiryDate) formData.append('expiryDate', new Date(data.expiryDate).toISOString());

    let result;
    if (product) {
      formData.append('id', product.id);
      result = await updateProduct(formData);
    } else {
      result = await createProduct(formData);
    }

    if (result.success && result.message) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      router.push('/admin/products');
    } else if (result.error) {
       toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="barcode">Barcode</Label>
                     <div className="flex items-center gap-2">
                      <Input id="barcode" {...register('barcode')} />
                      <Button type="button" variant="outline" size="icon" onClick={openExternalScanner}>
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.barcode && (
                      <p className="text-sm text-destructive">{errors.barcode.message}</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input id="stock" type="number" {...register('stock')} />
                    {errors.stock && (
                      <p className="text-sm text-destructive">{errors.stock.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-3">
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" type="number" step="0.01" {...register('price')} />
                      {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                      )}
                  </div>
                  <div className="grid gap-3">
                      <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                      <Input id="wholesalePrice" type="number" step="0.01" {...register('wholesalePrice')} />
                      {errors.wholesalePrice && (
                      <p className="text-sm text-destructive">{errors.wholesalePrice.message}</p>
                      )}
                  </div>
                    <div className="grid gap-3">
                      <Label htmlFor="retailPrice">Retail Price</Label>
                      <Input id="retailPrice" type="number" step="0.01" {...register('retailPrice')} />
                      {errors.retailPrice && (
                      <p className="text-sm text-destructive">{errors.retailPrice.message}</p>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="image">Image URL</Label>
                    <Input id="image" {...register('image')} />
                    {errors.image && (
                      <p className="text-sm text-destructive">{errors.image.message}</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" type="date" {...register('expiryDate')} />
                    {errors.expiryDate && (
                      <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
                    )}
                  </div>
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
    </>
  );
}
