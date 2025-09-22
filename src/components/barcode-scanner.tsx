'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detectionInterval: NodeJS.Timeout | null = null;

    const startScan = async (videoElement: HTMLVideoElement, streamInstance: MediaStream) => {
      if (!('BarcodeDetector' in window)) {
        console.error('Barcode Detector is not supported by this browser.');
        setError('Barcode scanning is not supported on this browser or device.');
        // Fallback to simulation for unsupported browsers
        setTimeout(() => handleScan('123456789012'), 3000);
        return;
      }

      // @ts-ignore - BarcodeDetector is not in all TS lib versions yet
      const barcodeDetector = new window.BarcodeDetector({
        formats: [
          'aztec',
          'code_128',
          'code_39',
          'code_93',
          'codabar',
          'data_matrix',
          'ean_13',
          'ean_8',
          'itf',
          'pdf417',
          'qr_code',
          'upc_a',
          'upc_e'
        ],
      });

      detectionInterval = setInterval(async () => {
        if (videoElement.readyState < 2 || loading) return;
        try {
          // @ts-ignore
          const barcodes = await barcodeDetector.detect(videoElement);
          if (barcodes.length > 0 && !loading) {
            handleScan(barcodes[0].rawValue);
          }
        } catch (e) {
          console.error('Barcode detection failed:', e);
          setError('An error occurred during barcode detection.');
        }
      }, 500);
    };

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play(); // Ensure video starts playing
          startScan(videoRef.current, stream);
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
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (barcodeValue: string) => {
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    setError(null);
    try {
      const result = await barcodeProductLookup({ barcode: barcodeValue });
      result.imageUrl = `https://picsum.photos/seed/${result.productId || 'ai-product'}/400/400`;
      
      // Stop camera after successful scan
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      onScan(result);

    } catch (e) {
      setError('Failed to look up product. Please try again.');
      console.error(e);
      setLoading(false); // Stop loading on error so user can try again or close
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scanning Barcode</DialogTitle>
          <DialogDescription>
            Center the product's barcode inside the frame.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 flex aspect-video w-full items-center justify-center rounded-lg bg-secondary/50 overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <div className="absolute inset-0 border-4 border-white/50 rounded-lg pointer-events-none" style={{
              clipPath: 'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)'
            }}></div>
            
            {loading && (
                 <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="mt-2">Looking up product...</span>
                </div>
            )}
        </div>
       
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access to use this feature.
                </AlertDescription>
            </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}