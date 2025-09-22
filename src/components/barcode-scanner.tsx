'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any | null>(null); // To hold BarcodeDetector instance
  const animationFrameRef = useRef<number | null>(null);
  const scannedBarcodes = useRef(new Set<string>());
  const { toast } = useToast();

  const handleProductFound = (product: BarcodeProductLookupOutput) => {
    setStatus('success');
    onScan(product);
    setTimeout(() => {
        // After showing success for a bit, go back to scanning
        // but keep the barcode in the scanned set for a longer duration
        // to prevent immediate re-scans of the same item.
        setStatus('scanning');
    }, 1500);
    setTimeout(() => {
        if(product.productId){
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
          const result = await barcodeProductLookup({ barcode: barcode });
          if (result && result.productName && result.productName.toLowerCase() !== 'not found' && result.productName.trim() !== '') {
              // Use a more stable seed for placeholder images
              result.imageUrl = `https://picsum.photos/seed/${result.productId || barcode}/400/400`;
              handleProductFound(result);
          } else {
              handleProductError(barcode, 'Product not found for this barcode.');
          }
      } catch (e: any) {
          handleProductError(barcode, e.message || 'Failed to look up product.');
      }
  }, [status, onScan]);


  const detectBarcode = useCallback(async () => {
    if (videoRef.current && scannerRef.current && videoRef.current.readyState >= 2) {
      try {
        const barcodes = await scannerRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          for (const barcode of barcodes) {
            if (barcode.rawValue) {
                lookupBarcode(barcode.rawValue);
                // Once we start a lookup, pause detection briefly
                return;
            }
          }
        }
      } catch (error) {
        console.error('Barcode detection error:', error);
      }
    }
    // Continue scanning if no barcode was found or lookup is not in progress
    if (status === 'scanning') {
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
    }
  }, [lookupBarcode, status]);

  useEffect(() => {
    const initializeScanner = async () => {
      // @ts-ignore
      if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
        setStatus('error');
        setErrorMessage('Barcode Detector API is not supported by this browser.');
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(console.error);
        }
        
        // @ts-ignore
        scannerRef.current = new window.BarcodeDetector({
            formats: [ 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code' ],
        });

        // Start detection loop only when video is playing
        const videoElement = videoRef.current;
        if (videoElement) {
            const handleVideoPlaying = () => {
                animationFrameRef.current = requestAnimationFrame(detectBarcode);
            };
            videoElement.addEventListener('playing', handleVideoPlaying);
            return () => {
                videoElement.removeEventListener('playing', handleVideoPlaying);
            };
        }

      } catch (error) {
        console.error('Camera access error:', error);
        setHasCameraPermission(false);
        setStatus('error');
        setErrorMessage('Camera access was denied. Please grant permission in your browser settings.');
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        onClose();
      }
    };

    initializeScanner();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [detectBarcode, onClose, toast]);

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
            Center the product's barcode inside the frame. The scanner is active.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <StatusOverlay />
        </div>
       
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {errorMessage || 'Camera not available. Please ensure permissions are granted.'}
                </AlertDescription>
            </Alert>
        )}
        
      </DialogContent>
    </Dialog>
  );
}
