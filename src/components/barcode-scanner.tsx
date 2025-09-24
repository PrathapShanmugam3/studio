
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { barcodeProductLookup } from '@/ai/flows/barcode-product-lookup';

interface BarcodeScannerProps {
  onScan: (product: any) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const processBarcode = useCallback(async (barcodeText: string) => {
    toast({
      title: 'Barcode Scanned',
      description: `Looking up product...`,
    });

    try {
      const product = await barcodeProductLookup({ barcode: barcodeText });
      onScan(product);
      onClose();
    } catch (error) {
      console.error('Product lookup failed:', error);
      toast({
        title: 'Product Not Found',
        description: 'Could not find a product for the scanned barcode.',
        variant: 'destructive',
      });
      // Allow for another scan
    }
  }, [onScan, onClose, toast]);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    const startScanning = async () => {
      if (!videoRef.current) return;
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        const selectedDeviceId = videoInputDevices[0].deviceId;
        
        controls = codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              processBarcode(result.getText());
              // Stop decoding after one successful scan
              if (controls) {
                controls.stop();
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('Barcode decoding error:', err);
              toast({
                  title: 'Scanning Error',
                  description: 'An error occurred while trying to scan.',
                  variant: 'destructive'
              })
            }
          }
        );
      } catch (error) {
        console.error('Error starting scanner:', error);
         toast({
            title: 'Camera Error',
            description: 'Could not access camera. Please ensure permissions are granted and the camera is not in use by another app.',
            variant: 'destructive'
        });
        onClose();
      }
    };

    startScanning();

    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [onClose, processBarcode, toast]);


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

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
