'use client';

import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/cart-context';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            data-ai-hint="product image"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between p-4">
        <div>
          <CardTitle className="mb-1 text-lg font-headline">{product.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm">{product.description}</CardDescription>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
          <Button size="sm" className="gap-2 bg-accent hover:bg-accent/80" onClick={handleAddToCart}>
            <PlusCircle className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
