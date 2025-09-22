'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

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

interface BarcodeScannerProps {
    onScan: (product: BarcodeProductLookupOutput) => void;
    onClose: () => void;
}

type ScanStatus = 'idle' | 'scanning' | 'loading' | 'success' | 'error';

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const scannedBarcodes = useRef(new Set<string>());
  const { toast } = useToast();

  const handleProductFound = (product: BarcodeProductLookupOutput) => {
    setStatus('success');
    onScan(product);
    setTimeout(() => {
        setStatus('scanning');
    }, 1500);
    // Allow the same barcode to be scanned again after 5 seconds
    setTimeout(() => {
        if (product.productId) {
            scannedBarcodes.current.delete(product.productId);
        }
    }, 5000);
  };
  
  const handleProductError = (barcode: string, errorMsg: string) => {
      setErrorMessage(errorMsg);
      setStatus('error');
      console.error(errorMsg);
      setTimeout(() => {
          setStatus('scanning');
          setErrorMessage(null);
          scannedBarcodes.current.delete(barcode);
      }, 2500);
  };

  const lookupBarcode = useCallback(async (barcode: string) => {
      if (scannedBarcodes.current.has(barcode) || status !== 'scanning') return;
      
      setStatus('loading');
      scannedBarcodes.current.add(barcode);

      try {
          const result = await barcodeProductLookup({ barcode });
          if (result && result.productName && result.productName.toLowerCase() !== 'not found' && result.productName.trim() !== '') {
              // Use a consistent placeholder image based on the product ID or barcode
              result.imageUrl = `https://picsum.photos/seed/${result.productId || barcode}/400/400`;
              handleProductFound(result);
          } else {
              handleProductError(barcode, 'Product not found for this barcode.');
          }
      } catch (e: any) {
          handleProductError(barcode, e.message || 'Failed to look up product.');
      }
  }, [status, onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const codeReader = codeReaderRef.current;

    const startScanning = async () => {
      if (!videoRef.current) return;

      setStatus('scanning');

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setHasCameraPermission(true);
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        codeReader.decodeFromVideoDevice(
          undefined,
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
      } catch (err: any) {
        console.error('Camera initialization failed:', err);
        setHasCameraPermission(false);
        setStatus('error');
        let friendlyMessage = 'Could not access camera.';
        if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError') {
                friendlyMessage = 'Camera permission was denied. Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                friendlyMessage = 'No camera found. Please ensure a camera is connected.';
            } else if (err.name === 'NotReadableError') {
                friendlyMessage = 'The camera is already in use by another application.';
            }
        }
        setErrorMessage(friendlyMessage);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: friendlyMessage,
          duration: 9000
        });
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [lookupBarcode, status, toast]);

  const StatusOverlay = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            <Loader2 className="h-10 w-10 animate-spin" />
            <span className="mt-4 text-lg">Looking up product...</span>
          </div>
        );
      case 'success':
        return (
          <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center text-white">
            <CheckCircle className="h-12 w-12" />
            <span className="mt-4 text-lg font-semibold">Product Added!</span>
          </div>
        );
      case 'error':
         if (!errorMessage?.includes('Product not found')) {
            return null; // Don't show overlay for product not found error
         }
        return (
          <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center text-white text-center p-4">
            <XCircle className="h-12 w-12" />
            <span className="mt-4 text-lg font-semibold">Scan Error</span>
            <p className="text-sm">{errorMessage}</p>
          </div>
        );
      case 'scanning':
         return (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-[90%] h-1/2 border-y-4 border-dashed border-white/50 rounded-lg" />
             </div>
         );
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scan Barcode</DialogTitle>
          <DialogDescription>
            Center the product's barcode inside the frame.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <StatusOverlay />
        </div>
       
        {hasCameraPermission === false && errorMessage && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Initialization Failed</AlertTitle>
                <AlertDescription>
                    {errorMessage}
                </AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
