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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { barcodeProductLookup } from '@/ai/flows/barcode-product-lookup';
import { useToast } from '@/hooks/use-toast';
import { Loader2, XCircle, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [status, setStatus] = useState<'scanning' | 'loading' | 'error'>(
    'scanning'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<any>(null);

  const lookupBarcode = useCallback(
    async (barcode: string) => {
      if (status === 'loading') return;
      setStatus('loading');
      try {
        const product = await barcodeProductLookup({ barcode });

        if (product?.productName && product.productName.toLowerCase() !== 'not found') {
          product.imageUrl = `https://picsum.photos/seed/${
            product.productId || barcode
          }/400/400`;
          onScan(product);
        } else {
          setErrorMessage('Product not found for this barcode.');
          setTimeout(() => {
            setErrorMessage(null);
            setStatus('scanning');
          }, 2000);
        }
      } catch (e: any) {
        console.error('Lookup error:', e);
        setErrorMessage(e.message || 'Failed to lookup product.');
        setTimeout(() => {
          setErrorMessage(null);
          setStatus('scanning');
        }, 2000);
      }
    },
    [onScan, status, toast]
  );

  useEffect(() => {
    if (!videoRef.current) return;

    const codeReader = codeReaderRef.current;
    
    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error, controls) => {
      if (!hasCameraPermission) {
        setHasCameraPermission(true);
      }
      controlsRef.current = controls;

      if (result && status === 'scanning') {
        lookupBarcode(result.getText());
      }
      
      if (error && !(error instanceof NotFoundException)) {
        console.error('ZXing decode error:', error);
        setStatus('error');
        setErrorMessage('Error scanning barcode.');
      }
    }).catch(err => {
      console.error('Camera error:', err);
      setHasCameraPermission(false);
      setStatus('error');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please grant access in your browser settings.'
          : 'Could not access camera. It might be used by another application.'
      );
    });

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [lookupBarcode, status, hasCameraPermission]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point the camera at a product's barcode to add it to the sale.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4 aspect-video w-full overflow-hidden rounded-lg bg-secondary">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
              <CameraOff className="h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-lg font-semibold">Camera Access Denied</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">Please grant camera permissions in your browser settings to use the scanner.</p>
            </div>
          )}

          {(status === 'loading' || status === 'error' && errorMessage) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin" />}
              {status === 'error' && errorMessage && <XCircle className="h-12 w-12 text-destructive" />}
              <p className="mt-2 text-center">{status === 'loading' ? 'Looking up barcode...' : errorMessage}</p>
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
