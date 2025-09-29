'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat, Result } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';
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
  const [loading, setLoading] = useState(false);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());


  useEffect(() => {
    let isMounted = true;
    const getCameraDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (isMounted) {
          if (videoInputDevices.length > 0) {
            setVideoDevices(videoInputDevices);
            const backCamera =
              videoInputDevices.find(device => device.label.toLowerCase().includes('back')) ||
              videoInputDevices.find(device => device.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCamera?.deviceId || videoInputDevices[0].deviceId);
          } else {
            toast({
              title: 'No Camera Found',
              description: 'Could not find any video devices.',
              variant: 'destructive'
            });
            onClose();
          }
        }
      } catch (error) {
        console.error("Camera permission error:", error);
        toast({
          title: 'Camera Error',
          description: 'Could not access camera. Please ensure permissions are granted.',
          variant: 'destructive'
        });
        if (isMounted) onClose();
      }
    };

    getCameraDevices();

    return () => {
      isMounted = false;
      // Ensure controls are stopped when the component unmounts for any reason
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [onClose, toast]);


  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current) {
      return;
    }
    
    const startScanning = async () => {
        try {
            const videoEl = videoRef.current;
            if (!videoEl) return;
            
            const hints = new Map();
            const formats = [
                BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
                BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.ITF,
                BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC, BarcodeFormat.PDF_417,
            ];
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            
            const codeReader = codeReaderRef.current;
            codeReader.hints = hints;
            
            // This is the correct pattern: decodeFromVideoDevice returns controls when a callback is provided.
            controlsRef.current = codeReader.decodeFromVideoDevice(selectedDeviceId, videoEl, (result: Result | null, error?: Error) => {
                if (result) {
                    setLoading(true);
                    onScan(result.getText());
                }

                if (error && !(error instanceof NotFoundException)) {
                    console.error('Barcode decoding error:', error);
                }
            });

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

    // This cleanup function is crucial.
    return () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
    };
  }, [selectedDeviceId, onClose, onScan, toast]);

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1 && selectedDeviceId) {
      if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
      }
      const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md p-4 relative border">
        <h3 className="text-lg font-semibold mb-1 text-center">Scan Barcode</h3>
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Point the camera at a product's barcode.
        </p>

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
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-lg">Processing...</p>
             </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {videoDevices.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwitchCamera}
              aria-label="Switch Camera"
              disabled={loading}
            >
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
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
