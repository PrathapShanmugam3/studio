
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Exception, DecodeHintType } from '@zxing/library';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isProcessingRef = useRef(false);

  // Effect for initializing devices and the code reader
  useEffect(() => {
    const hints = new Map();
    const formats = [10, 11, 1, 2, 4, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    codeReaderRef.current = new BrowserMultiFormatReader(hints);

    let isMounted = true;
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (isMounted && videoInputDevices.length > 0) {
          setVideoDevices(videoInputDevices);
          const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back'));
          setSelectedDeviceId(backCamera?.deviceId || videoInputDevices[0].deviceId);
        } else if (isMounted) {
          toast({ title: 'No Camera Found', description: 'Could not find any video devices.', variant: 'destructive' });
          onClose();
        }
      } catch (error) {
        console.error("Could not get video devices.", error);
        toast({ title: 'Camera Error', description: 'Could not access camera. Please ensure permissions are granted.', variant: 'destructive' });
        onClose();
      }
    };
    
    getDevices();

    return () => { isMounted = false; };
  }, [onClose, toast]);


  // Effect for starting/stopping the scanner
  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current || !codeReaderRef.current) {
      return;
    }

    const codeReader = codeReaderRef.current;
    let isMounted = true;
    isProcessingRef.current = false; // Reset processing flag

    const startScanning = async () => {
        try {
            await codeReader.decodeFromVideoDevice(
              selectedDeviceId,
              videoRef.current,
              (result, err) => {
                if (!isMounted || isProcessingRef.current) return;

                if (result) {
                    isProcessingRef.current = true;
                    onScan(result.getText());
                    // onClose is called by the parent component after handling the scan
                }
                
                if (err && !(err instanceof NotFoundException) && !(err instanceof DOMException)) {
                    console.error('Barcode decoding error:', err);
                    toast({
                        title: 'Scanning Error',
                        description: 'An error occurred during scanning.',
                        variant: 'destructive'
                    });
                }
              }
            );
        } catch (startError) {
            console.error('Error starting scanner:', startError);
            if(isMounted) {
                 toast({
                    title: 'Scanner Start Error',
                    description: 'Failed to initialize the scanner. The camera might be in use by another application.',
                    variant: 'destructive'
                 });
                onClose();
            }
        }
    };

    startScanning();

    // Cleanup function
    return () => {
        isMounted = false;
        isProcessingRef.current = true; // prevent any pending callbacks from firing
        if (codeReader) {
          codeReader.reset(); 
        }
    };
  }, [selectedDeviceId, onScan, onClose, toast]);
  

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
            playsInline
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
