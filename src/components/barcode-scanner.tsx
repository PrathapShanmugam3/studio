'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Barcode, Camera, Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { barcodeProductLookup, type BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { useCart } from '@/context/cart-context';

export function BarcodeScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<BarcodeProductLookupOutput | null>(null);
  const { dispatch } = useCart();

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setProduct(null);
    try {
      const result = await barcodeProductLookup({ barcode: '123456789012' });
      // The AI can sometimes return an invalid image URL, so we replace it.
      if (!result.imageUrl || !result.imageUrl.startsWith('http')) {
        result.imageUrl = 'https://picsum.photos/seed/ai-product/400/400';
      }
      setProduct(result);
    } catch (e) {
      setError('Failed to look up product. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const cartProduct = {
      id: product.productId,
      name: product.productName,
      description: product.description,
      price: product.price,
      stock: 1, // Assume stock is available
      image: product.imageUrl,
    };
    dispatch({ type: 'ADD_ITEM', payload: cartProduct });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Barcode className="h-5 w-5" />
          Scan Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scan Product Barcode</DialogTitle>
          <DialogDescription>
            Center the product&apos;s barcode inside the frame to scan it.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary/50">
          <Camera className="h-16 w-16 text-muted-foreground" />
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Looking up product...</span>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {product && (
          <div className="flex flex-col gap-4 rounded-lg border p-4">
             <div className="flex items-center gap-4">
                <Image
                    src={product.imageUrl}
                    alt={product.productName}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                    data-ai-hint="scanned product"
                />
                <div className="flex-1">
                    <h3 className="font-bold">{product.productName}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                </div>
            </div>
            <Button className="w-full gap-2 bg-accent hover:bg-accent/80" onClick={handleAddToCart}>
                <PlusCircle className="h-4 w-4" />
                Add to Cart
            </Button>
          </div>
        )}
        <DialogFooter>
          {!product && !loading && (
             <Button className="w-full" onClick={handleScan}>
                <Camera className="mr-2 h-4 w-4" />
                Simulate Scan
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
