
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
import { Loader2, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, Result, Exception, IScannerControls } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'scanning' | 'loading' | 'permission_denied'>('scanning');
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
  const { toast } = useToast();

  const codeReader = new BrowserMultiFormatReader();

  const processBarcode = useCallback(async (barcode: string) => {
    if (status !== 'scanning') return;

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
        setStatus('scanning');
      }
    } catch (e: any) {
      console.error('Lookup error:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to look up the product. Please try again.',
      });
      setStatus('scanning');
    }
  }, [onScan, toast, status]);

  useEffect(() => {
    let controls: IScannerControls | undefined;

    const startScanner = async () => {
      if (!videoRef.current) return;
    
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasPermission(true);
    
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          controls = await codeReader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
            if (result) {
              processBarcode(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error(err);
            }
          });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        setStatus('permission_denied');
      }
    };

    startScanner();

    return () => {
        if (controls) {
            controls.stop();
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };
  }, [processBarcode]);
  

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
            autoPlay
            muted
          />
          
          {status === 'permission_denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center text-white">
               <CameraOff className="h-12 w-12 text-destructive" />
              <p className="mt-4">Camera permission was denied. Please grant access in your browser settings.</p>
            </div>
          )}

          {hasPermission === false && status !== 'permission_denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <Alert variant="destructive">
                    <CameraOff className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
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
