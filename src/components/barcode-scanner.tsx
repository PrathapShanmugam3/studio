'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Result, Exception } from '@zxing/library';
import { Loader2, CameraOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<'scanning' | 'loading' | 'permission_denied' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  const { toast } = useToast();

  const processBarcode = useCallback(async (barcodeText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    console.log(`Detected barcode: ${barcodeText}`);
    
    toast({
        title: "Barcode Scanned",
        description: `Value: ${barcodeText}`,
    });

    onClose();

  }, [onClose, toast]);

  useEffect(() => {
    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    const startScanner = async () => {
      if (!videoRef.current) return;
      try {
        // Use decodeFromVideoDevice which handles stream setup
        controls = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: Result | undefined, error: Exception | undefined) => {
            if (!isMounted) return;
            if (result && !isProcessingRef.current) {
                processBarcode(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
                console.error('ZXing decode error:', error);
                if (isMounted) {
                  setErrorMessage('Error during scanning. Please check console.');
                  setStatus('error');
                }
            }
        });
      } catch (err: any) {
        console.error('Camera initialization error', err);
        if (isMounted) {
          setStatus('permission_denied');
          setErrorMessage(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser.'
              : err?.message || 'Could not access camera. It might be in use by another app.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (controls) {
        controls.stop();
      }
    };
  }, [processBarcode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-1">Scan Barcode</h3>
        <p className="text-sm text-muted-foreground mb-3">Point the camera at a product's barcode.</p>

        <div className="rounded-md overflow-hidden bg-black aspect-video relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/2 border-2 border-red-500/70 rounded-lg" />
           </div>
        </div>

        {status === 'permission_denied' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <CameraOff className="w-5 h-5" />
            <div>
              <div className="font-medium">Camera Access Denied</div>
              <div className="text-xs text-muted-foreground">{errorMessage}</div>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div>Looking up barcode...</div>
          </div>
        )}

         {status === 'scanning' && !isProcessingRef.current && (
            <div className="mt-3 flex items-center justify-center text-sm text-green-600">
                <p>Ready to scan</p>
            </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="mt-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
