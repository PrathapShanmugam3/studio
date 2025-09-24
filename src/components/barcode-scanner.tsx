
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Exception, Result } from '@zxing/library';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

// Define a type for the scanner controls for type safety.
type ScannerControls = {
  stop: () => void;
};

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  
  // Use a ref to hold a stable instance of the code reader.
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  // Use a ref to hold the controls object, which has the .stop() method.
  const controlsRef = useRef<ScannerControls | null>(null);

  // This effect runs once to get camera permissions and list devices.
  useEffect(() => {
    let isMounted = true;
    const getCameraDevices = async () => {
      try {
        // First, ask for permission to ensure device labels are available.
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (isMounted) {
          if (videoInputDevices.length > 0) {
            setVideoDevices(videoInputDevices);
            // Prefer the back camera ('environment') for mobile devices.
            const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || 
                               videoInputDevices.find(device => device.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCamera?.deviceId || videoInputDevices[0].deviceId);
          } else {
            toast({ title: 'No Camera Found', description: 'Could not find any video devices.', variant: 'destructive' });
            onClose();
          }
        }
      } catch (error) {
        console.error("Camera permission error:", error);
        toast({ title: 'Camera Error', description: 'Could not access camera. Please ensure permissions are granted.', variant: 'destructive' });
        if (isMounted) onClose();
      }
    };

    getCameraDevices();

    return () => {
      isMounted = false;
      // Ensure the camera is released when the component unmounts.
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [onClose, toast]);


  // This effect starts/restarts the scanner whenever the selected camera changes.
  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current) {
      return;
    }
    
    // Stop any existing scanner before starting a new one.
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    const codeReader = codeReaderRef.current;
    let isProcessing = false;
    let lastScanTime = 0;
    const SCAN_INTERVAL = 200; // ms

    const startScanning = async () => {
        try {
            if (!videoRef.current) return;

            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: selectedDeviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            };

            const controls = await codeReader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result: Result | undefined, err: Exception | undefined) => {
                    if (result && !isProcessing) {
                        const now = Date.now();
                        if (now - lastScanTime > SCAN_INTERVAL) {
                            lastScanTime = now;
                            isProcessing = true;
                            onScan(result.getText());
                            // Do not close here, let the parent component decide.
                        }
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        console.error('Barcode decoding error:', err);
                    }
                }
            );
            // Store the controls so we can stop the stream later.
            controlsRef.current = controls;
        } catch (startError) {
            console.error('Error starting scanner:', startError);
            toast({
                title: 'Scanner Start Error',
                description: 'Failed to initialize the scanner. The camera might be in use by another application.',
                variant: 'destructive'
            });
            onClose();
        }
    };
    
    startScanning();

    // The main cleanup is in the unmount effect, but this ensures controls are reset on device change.
    return () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
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
            <Button variant="ghost" size="icon" onClick={handleSwitchCamera} aria-label="Switch Camera">
              <Camera className="w-5 h-5" />
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
