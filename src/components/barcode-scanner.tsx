
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { barcodeProductLookup } from '@/ai/flows/barcode-product-lookup';
import { Loader2, XCircle, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  
  const [status, setStatus] = useState<'scanning' | 'loading' | 'error' | 'permission'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const processBarcode = useCallback(async (barcode: string) => {
    setStatus('loading');
    try {
      const product = await barcodeProductLookup({ barcode });

      if (product?.productName && product.productName.toLowerCase() !== 'not found' && product.productName.toLowerCase() !== 'product not found') {
        product.imageUrl = `https://picsum.photos/seed/${product.productId || barcode}/400/400`;
        onScan(product);
      } else {
        toast({
          variant: 'destructive',
          title: 'Product Not Found',
          description: 'No product could be found for the scanned barcode.',
        });
        setStatus('scanning'); // Go back to scanning
      }
    } catch (e: any) {
      console.error('Lookup error:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to look up the product. Please try again.',
      });
      setStatus('scanning'); // Go back to scanning
    }
  }, [onScan, toast]);

  useEffect(() => {
    const codeReader = codeReaderRef.current;
    let isMounted = true;

    const startScanner = async () => {
      if (!isMounted || !videoRef.current) return;

      try {
        await codeReader.decodeFromVideoDevice(
          null, // use default camera
          videoRef.current,
          (result, error, controls) => {
            if (!isMounted) {
                controls.stop();
                return;
            }
            if (result && status === 'scanning') {
                processBarcode(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
              console.error('ZXing decode error:', error);
            }
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera initialization error:', err);
        setStatus('permission');
        if (err.name === 'NotAllowedError') {
          setErrorMessage('Camera permission was denied. Please grant access in your browser settings.');
        } else {
          setErrorMessage('Could not access the camera. It might be in use by another application or not available.');
        }
      }
    };
    
    startScanner();

    return () => {
      isMounted = false;
      codeReader.reset();
    };
  }, [processBarcode, status]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point the camera at a product's barcode.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4 aspect-video w-full overflow-hidden rounded-lg bg-secondary">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
          />
          
          {(status === 'permission') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center text-white">
               <CameraOff className="h-12 w-12 text-destructive" />
              <p className="mt-4">{errorMessage}</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="mt-4">Looking up barcode...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
