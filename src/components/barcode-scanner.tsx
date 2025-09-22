'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { barcodeProductLookup } from '@/ai/flows/barcode-product-lookup';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const [status, setStatus] = useState<'scanning' | 'loading' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const lookupBarcode = useCallback(async (barcode: string) => {
    setStatus('loading');
    try {
      const product = await barcodeProductLookup({ barcode });
      if (product && product.productName) {
         onScan(product);
      } else {
        throw new Error("Product not found for this barcode.");
      }
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      setStatus('error');
      setErrorMessage('Could not find a product for the scanned barcode. Please try another.');
      // Reset to scanning after a delay to allow user to see the message
      setTimeout(() => {
          setStatus('scanning');
          setErrorMessage(null);
      }, 3000);
    }
  }, [onScan]);

  useEffect(() => {
    const codeReader = codeReaderRef.current;
    let stream: MediaStream;

    const startScanning = async () => {
      if (!videoRef.current) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setHasCameraPermission(true);
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            codeReader.decodeFromVideoDevice(
                null, 
                videoRef.current,
                (result, error) => {
                    if (result && status === 'scanning') {
                        lookupBarcode(result.getText());
                    }
                    if (error && !(error instanceof NotFoundException)) {
                        console.error('ZXing decode error:', error);
                    }
                }
            );
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        setHasCameraPermission(false);
        setStatus('error');
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please enable it in your browser settings.'
            : 'Could not access camera.'
        );
        toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: err.name === 'NotAllowedError' ? 'Camera permission denied. Please enable it in your browser settings.' : 'Could not access camera.',
        });
        onClose(); // Close dialog on critical camera error
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [status, lookupBarcode, onClose, toast]);


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at a product's barcode.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
              <Loader2 className="mb-2 h-8 w-8 animate-spin" />
              <p>Looking up product...</p>
            </div>
          )}
           <div className="absolute inset-0 z-10" style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.4) 100%)',
            boxShadow: 'inset 0 0 0 4px hsl(var(--primary))'
           }}/>
        </div>
        
        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
            <Alert variant="destructive">
                <AlertTitle>Scan Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
