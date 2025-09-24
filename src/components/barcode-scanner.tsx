
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Exception, Result } from '@zxing/library';
import { Camera, X } from 'lucide-react';
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
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const isProcessingRef = useRef(false);

  const processBarcode = useCallback(async (barcodeText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    toast({
      title: 'Barcode Scanned',
      description: `Looking up product...`,
    });

    try {
      const product = await barcodeProductLookup({ barcode: barcodeText });
      onScan(product);
      onClose(); // Close after successful scan and lookup
    } catch (error) {
      console.error('Product lookup failed:', error);
      toast({
        title: 'Product Not Found',
        description: 'Could not find a product for the scanned barcode.',
        variant: 'destructive',
      });
      // Reset for next scan attempt, in case the modal doesn't close
      isProcessingRef.current = false;
    }
  }, [onScan, onClose, toast]);
  
  // Effect for initializing devices
  useEffect(() => {
    let isMounted = true;
    const getDevices = async () => {
      try {
        // First, ensure we have permission
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (isMounted && videoInputDevices.length > 0) {
          setVideoDevices(videoInputDevices);
          // Prefer environment (back) camera
          const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back'));
          setSelectedDeviceId(backCamera?.deviceId || videoInputDevices[0].deviceId);
        } else if (isMounted) {
            toast({
              title: 'No Camera Found',
              description: 'Could not find any video devices.',
              variant: 'destructive'
            });
            onClose();
        }
      } catch (error) {
        console.error("Could not get video devices.", error);
        toast({
            title: 'Camera Error',
            description: 'Could not access camera. Please ensure permissions are granted.',
            variant: 'destructive'
        });
        onClose();
      }
    };
    
    getDevices();

    return () => {
      isMounted = false;
    };
  }, [onClose, toast]);


  // Effect for starting/stopping the scanner
  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current) {
      return;
    }

    const codeReader = codeReaderRef.current;
    let isMounted = true;

    const startScanning = async () => {
        isProcessingRef.current = false; // Reset processing flag
        try {
            await codeReader.decodeFromVideoDevice(
              selectedDeviceId,
              videoRef.current,
              (result, err) => {
                if (!isMounted) return;

                if (result) {
                    processBarcode(result.getText());
                }
                
                if (err && !(err instanceof NotFoundException)) {
                    console.error('Barcode decoding error:', err);
                }
              }
            );
        } catch (startError) {
            console.error('Error starting scanner:', startError);
             toast({
                title: 'Scanner Start Error',
                description: 'Failed to initialize the scanner with the selected camera.',
                variant: 'destructive'
             });
            onClose();
        }
    };

    startScanning();

    // Cleanup function
    return () => {
        isMounted = false;
        codeReader.reset(); // This properly stops the decoding and releases the camera
    };
  }, [selectedDeviceId, processBarcode, onClose, toast]);
  

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1 && selectedDeviceId) {
      const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md p-4 relative border">
        <h3 className="text-lg font-semibold mb-1 text-center">Scan Barcode</h3>
        <p className="text-sm text-muted-foreground mb-3 text-center">Point the camera at a product's barcode.</p>

        <div className="rounded-md overflow-hidden bg-black aspect-video relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline // Important for iOS
            autoPlay
            muted
          />
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/2 border-2 border-primary/70 rounded-lg shadow-[0_0_15px_5px_rgba(0,0,0,0.5)]" />
           </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {videoDevices.length > 1 && (
            <Button variant="ghost" size="icon" onClick={handleSwitchCamera}>
              <Camera className="w-5 h-5" />
              <span className="sr-only">Switch Camera</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
