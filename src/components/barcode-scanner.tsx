'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Loader2, CameraOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import { barcodeProductLookup } from '@/ai/flows/barcode-product-lookup';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (product: BarcodeProductLookupOutput) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // controls object returned by decodeFromVideoDevice (used to stop the scanner)
  const controlsRef = useRef<any | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [status, setStatus] = useState<'scanning' | 'loading' | 'permission_denied' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { toast } = useToast();

  // Lookup function: prevents concurrent lookups and stops scanner while looking up
  const lookupAndEmit = useCallback(
    async (barcodeText: string) => {
      if (status === 'loading') return; // avoid duplicate lookups
      setStatus('loading');

      try {
        // stop the scanner to avoid duplicate detections while we lookup
        try {
          controlsRef.current?.stop();
        } catch (e) {
          // ignore stop errors
          console.warn('controls.stop() failed', e);
        }

        const product = await barcodeProductLookup({ barcode: barcodeText });

        if (product?.productName && !['not found', 'product not found'].includes(product.productName.toLowerCase())) {
          product.imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.productId || barcodeText}/400/400`;
          onScan(product);
        } else {
          toast({
            variant: 'destructive',
            title: 'Product Not Found',
            description: 'No product could be found for the scanned barcode.',
          });
          setStatus('scanning');
          // restart scanner below will be handled in useEffect cleanup/start if needed
        }
      } catch (err: any) {
        console.error('Lookup error', err);
        toast({
          variant: 'destructive',
          title: 'Lookup failed',
          description: err?.message || 'Failed to lookup barcode. Try again.',
        });
        setStatus('scanning');
      }
    },
    [onScan, toast, status]
  );

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let mounted = true;

    (async () => {
      if (!videoRef.current) return;

      try {
        // Start continuous decode from default camera (undefined -> default)
        // decodeFromVideoDevice returns a controls object (you can call controls.stop()).
        // We await it and store the returned controls in controlsRef.
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err, controlsFromCallback) => {
            // result may be undefined when no code found for a frame
            if (!mounted) return;
            // the callback also passes controls; ensure we capture it
            if (!controlsRef.current && controlsFromCallback) {
              controlsRef.current = controlsFromCallback;
            }

            if (result && status === 'scanning') {
              // got a barcode string
              const barcodeText = result.getText();
              lookupAndEmit(barcodeText);
            }

            // non-NotFound errors can be logged for debugging
            if (err) {
              // NotFound errors are expected whenever a frame doesn't contain a code
              // keep scanning silently for those; log others
              // (Some older libs expose NotFound via name/message — we don't rely on import)
              if ((err as any).name !== 'NotFoundException') {
                console.warn('ZXing decode error', err);
                setErrorMessage('Error while scanning. See console for details.');
                setStatus('error');
              }
            }
          }
        );

        // store the controls if it was returned by the promise
        if (controls) controlsRef.current = controls;
      } catch (err: any) {
        console.error('Camera initialization / decodeFromVideoDevice error', err);
        if (!mounted) return;
        // Common reasons: permission denied, device in use
        setStatus('permission_denied');
        setErrorMessage(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser.'
            : err?.message || 'Could not access camera. It might be in use by another app.'
        );
      }
    })();

    // cleanup: stop controls (which stops the scanner + underlying stream)
    return () => {
      mounted = false;
      try {
        // If controls are present, stop scanning & camera
        if (controlsRef.current?.stop) {
          controlsRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping ZXing controls', e);
      }

      // Additionally, if video has a srcObject, stop tracks (defensive)
      if (videoRef.current?.srcObject) {
        try {
          const s = videoRef.current.srcObject as MediaStream;
          s.getTracks().forEach((t) => t.stop());
        } catch (e) {
          // ignore
        }
        if (videoRef.current) videoRef.current.srcObject = null;
      }

      // try to cleanup reader (some versions don't expose reset — avoid calling unknown methods)
      try {
        // @ts-ignore runtime-safe best-effort cleanup if available
        if (readerRef.current?.reset) (readerRef.current as any).reset();
      } catch {
        // ignore
      }
    };
  }, [lookupAndEmit, status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 relative">
        <button
          onClick={() => {
            // ensure we stop camera when closing
            try {
              controlsRef.current?.stop();
            } catch (e) {
              console.warn('stop on close failed', e);
            }
            if (videoRef.current?.srcObject) {
              try {
                const s = videoRef.current.srcObject as MediaStream;
                s.getTracks().forEach((t) => t.stop());
              } catch (e) {}
              videoRef.current.srcObject = null;
            }
            onClose();
          }}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-1">Scan Barcode</h3>
        <p className="text-sm text-muted-foreground mb-3">Point the camera at a product's barcode.</p>

        <div className="rounded-md overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
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

        {status === 'error' && errorMessage && (
          <div className="mt-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => {
            try {
              controlsRef.current?.stop();
            } catch {}
            if (videoRef.current?.srcObject) {
              try {
                const s = videoRef.current.srcObject as MediaStream;
                s.getTracks().forEach((t) => t.stop());
              } catch {}
              videoRef.current.srcObject = null;
            }
            onClose();
          }}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
