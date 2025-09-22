'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle, Video } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, type IScannerControls } from '@zxing/library';

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

type ScanStatus = 'idle' | 'waiting' | 'scanning' | 'loading' | 'success' | 'error';

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<IScannerControls | null>(null);
  const scannedBarcodes = useRef(new Set<string>());
  const { toast } = useToast();

  const handleProductFound = (product: BarcodeProductLookupOutput) => {
    setStatus('success');
    onScan(product);
    setTimeout(() => {
        setStatus('scanning');
        scannedBarcodes.current.clear(); // Allow scanning the same code again after success
    }, 1500);
  };

  const handleProductError = (barcode: string, errorMsg: string) => {
    setErrorMessage(errorMsg);
    setStatus('error');
    console.error(errorMsg);
    setTimeout(() => {
      setStatus('scanning');
      setErrorMessage(null);
      scannedBarcodes.current.delete(barcode); // Allow retrying the same failed code
    }, 2500);
  };

  const lookupBarcode = useCallback(
    async (barcode: string) => {
      if (scannedBarcodes.current.has(barcode)) return;

      setStatus('loading');
      scannedBarcodes.current.add(barcode);

      try {
        const result = await barcodeProductLookup({ barcode });
        if (result?.productName && result.productName.toLowerCase() !== 'not found' && result.productName.toLowerCase() !== 'unknown') {
          result.imageUrl = `https://picsum.photos/seed/${result.productId || barcode}/400/400`;
          handleProductFound(result);
        } else {
          handleProductError(barcode, 'Product not found.');
        }
      } catch (e: any) {
        handleProductError(barcode, e.message || 'Lookup failed.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScan] 
  );

 const startCamera = useCallback(async () => {
    if (!videoRef.current || status === 'scanning' || status === 'loading') return;

    setStatus('scanning');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, error, controls) => {
                // Ensure we only process scans when in the 'scanning' state.
                if (result && statusRef.current === 'scanning') {
                    lookupBarcode(result.getText());
                }
                if (error && !(error instanceof NotFoundException)) {
                    console.error('ZXing decode error:', error);
                }
            });
        }
    } catch (err: any) {
        console.error('Camera error:', err);
        setHasCameraPermission(false);
        setStatus('error');
        const message = err.name === 'NotAllowedError' ? 'Camera permission denied. Please enable it in your browser settings.' : 'Could not access camera. It may be in use by another application.';
        setErrorMessage(message);
        toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: message,
        });
        onClose();
    }
}, [status, lookupBarcode, onClose, toast]);

  // Use a ref to get the latest status inside the scanner callback without causing re-renders.
  const statusRef = useRef(status);
  useEffect(() => {
      statusRef.current = status;
  }, [status]);


  useEffect(() => {
    // This effect handles cleanup
    return () => {
      controlsRef.current?.stop();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const StatusOverlay = () => {
    switch (status) {
      case 'waiting':
        return (
          <button
            onClick={startCamera}
            className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 text-lg font-semibold rounded-lg hover:bg-black/60 transition-colors"
          >
            <Video className="mb-2 h-6 w-6" /> Start Camera
          </button>
        );
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
             <div className="absolute top-2 left-2 right-2 text-white text-center bg-black/30 p-1 rounded-md text-xs">Scanner is active</div>
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
          <DialogDescription>Center the product's barcode inside the frame.</DialogDescription>
        </DialogHeader>

        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary overflow-hidden relative">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <StatusOverlay />
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>Enable camera permissions in your browser settings.</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
