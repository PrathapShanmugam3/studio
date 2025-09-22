'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { barcodeProductLookup, type BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function BarcodeScanner() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<BarcodeProductLookupOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Barcode detection logic would go here. For now, we simulate it.
        setTimeout(() => {
          handleScan();
        }, 3000); // Simulate scan after 3 seconds

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await barcodeProductLookup({ barcode: '123456789012' });
      result.imageUrl = `https://picsum.photos/seed/${result.productId || 'ai-product'}/400/400`;
      setProduct(result);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(null); // Hide video feed
    } catch (e) {
      setError('Failed to look up product. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
      if(!product) return;
      // In a real app this would likely populate the "Add New Product" form
      toast({
          title: "Product Scanned!",
          description: `${product.productName} details are ready.`
      })
      router.push('/admin/products/new');
  }

  const handleClose = () => {
    setIsOpen(false);
    // Give dialog time to close before navigating
    setTimeout(() => router.push('/admin/products'), 150);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scan Product Barcode</DialogTitle>
          <DialogDescription>
            Center the product's barcode inside the frame to scan it.
          </DialogDescription>
        </DialogHeader>
        
        {hasCameraPermission && (
          <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          </div>
        )}
       
        {hasCameraPermission === false && (
            <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access to use this feature.
                </AlertDescription>
            </Alert>
        )}
        
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
            <Button className="w-full gap-2 bg-accent hover:bg-accent/80" onClick={handleAddProduct}>
                <PlusCircle className="h-4 w-4" />
                Add New Product
            </Button>
          </div>
        )}

        {(!product && hasCameraPermission === null && !loading) && (
            <div className='text-center p-4 text-muted-foreground'>
                <p>Could not find a barcode.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
