'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  barcodeProductLookup,
  type BarcodeProductLookupOutput,
} from '@/ai/flows/barcode-product-lookup';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

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
  const { toast } = useToast();

  const lookupBarcode = useCallback(async (barcode: string) => {
      setStatus('loading');
      try {
        const product = await barcodeProductLookup({ barcode });
        if (product?.productName && product.productName.toLowerCase() !== 'not found') {
          product.imageUrl = `https://picsum.photos/seed/${product.productId || barcode}/400/400`;
          setStatus('success');
          onScan(product);
        } else {
          setStatus('error');
          setErrorMessage('Product not found for this barcode.');
          setTimeout(() => {
              setStatus('scanning');
              setErrorMessage(null);
          }, 2000);
        }
      } catch (e: any) {
        setStatus('error');
        setErrorMessage(e.message || 'Failed to lookup product.');
        setTimeout(() => {
            setStatus('scanning');
            setErrorMessage(null);
        }, 2000);
      }
    }, [onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const codeReader = codeReaderRef.current;
    
    const startScanning = async () => {
        if (!videoRef.current) return;
        setStatus('scanning');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
                if (result && status !== 'loading' && status !== 'success') {
                  lookupBarcode(result.getText());
                }
                if (err && !(err instanceof NotFoundException)) {
                  console.error('ZXing decode error:', err);
                  setErrorMessage('Barcode decoding failed.');
                  setStatus('error');
                }
            });

        } catch (err: any) {
            console.error('Camera error:', err);
            setHasCameraPermission(false);
            if (err.name === 'NotAllowedError') {
                setErrorMessage('Camera permission was denied. Please grant permission in your browser settings.');
            } else {
                setErrorMessage('Could not access the camera. Please ensure it is not in use by another application.');
            }
            setStatus('error');
        }
    };
    
    startScanning();

    return () => {
        codeReader.reset();
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };
  }, [lookupBarcode, status]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point the camera at a product's barcode.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center p-4">
                    <CameraOff className="h-12 w-12 mb-2" />
                    <p>Camera permission denied.</p>
                </div>
            )}
            {status === 'loading' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className='mt-2'>Looking up product...</p>
                </div>
            )}
            {status === 'success' && (
                <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center text-white text-center">
                    <CheckCircle className="h-12 w-12" />
                    <span>Product Added!</span>
                </div>
            )}
            {status === 'error' && errorMessage && (
                <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center text-white text-center p-4">
                    <XCircle className="h-12 w-12" />
                    <p>{errorMessage}</p>
                </div>
            )}
        </div>
        
        {hasCameraPermission === false && (
             <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    {errorMessage || "Please grant camera permissions in your browser's settings to use the scanner."}
                </AlertDescription>
            </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
