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
  const { toast } = useToast();
  const scannedBarcodes = useRef(new Set<string>());

  const handleScan = useCallback(async (barcodeValue: string) => {
    if (scannedBarcodes.current.has(barcodeValue) || status === 'loading' || status === 'success') {
      return;
    }

    scannedBarcodes.current.add(barcodeValue);
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await barcodeProductLookup({ barcode: barcodeValue });
      
      // The AI can sometimes hallucinate even with a strict prompt.
      // A simple check for a valid name can prevent adding empty items.
      if (result.productName && result.productName.toLowerCase() !== 'not found' && result.productName.trim() !== '') {
        result.imageUrl = `https://picsum.photos/seed/${result.productId || 'ai-product'}/400/400`;
        onScan(result);
        setStatus('success');
      } else {
        throw new Error('Product not found for this barcode.');
      }
      
      setTimeout(() => {
        scannedBarcodes.current.delete(barcodeValue);
        setStatus('scanning');
      }, 1500);

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to look up product. Please try again.');
      setStatus('error');
      
      setTimeout(() => {
        scannedBarcodes.current.delete(barcodeValue);
        setStatus('scanning');
        setErrorMessage(null);
      }, 2500);
    }
  }, [onScan, status]);


  useEffect(() => {
    let stream: MediaStream | null = null;
    let detectionInterval: NodeJS.Timeout | null = null;
    // @ts-ignore
    let barcodeDetector: BarcodeDetector | null = null;
    
    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setErrorMessage('Barcode scanning is not supported on this browser or device.');
        setHasCameraPermission(false);
        setStatus('error');
        return;
      }

      if (!videoRef.current || !stream || stream.active === false) return;
      
      try {
        // @ts-ignore - BarcodeDetector is not in all TS lib versions yet
        barcodeDetector = new window.BarcodeDetector({
          formats: [ 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code' ],
        });

        detectionInterval = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && status === 'scanning') {
            try {
                // @ts-ignore
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleScan(barcodes[0].rawValue);
                }
            } catch (detectError) {
                console.error("Barcode detection failed:", detectError);
                // Don't set a persistent error, might be a temporary issue.
            }
          }
        }, 500); // Check for barcode every 500ms
      } catch (e) {
          console.error('BarcodeDetector initialization failed:', e);
          setErrorMessage('An error occurred while preparing the barcode scanner.');
          setStatus('error');
      }
    };

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for the video to be ready to play
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play failed:", e));
            startScan();
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        onClose();
      }
    };

    getCameraPermission();

    return () => {
      if (detectionInterval) clearInterval(detectionInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleScan]);

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
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <StatusOverlay />
        </div>
       
        {hasCameraPermission === false && status !== 'error' && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Not Available</AlertTitle>
                <AlertDescription>
                    Could not access camera. Please ensure permissions are granted and no other app is using it.
                </AlertDescription>
            </Alert>
        )}
        
      </DialogContent>
    </Dialog>
  );
}
