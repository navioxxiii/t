/**
 * QR Scanner Component
 * Modern QR code scanner for crypto wallet addresses
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, SwitchCamera, Flashlight, Check, AlertCircle, X } from 'lucide-react';
import Image from 'next/image';
import { getCoinIconPath } from '@/lib/constants/coins';

interface QrScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (address: string) => void;
  coinSymbol: string;
  coinName: string;
}

type CameraFacing = 'user' | 'environment';

export function QrScanner({
  open,
  onOpenChange,
  onScan,
  coinSymbol,
  coinName,
}: QrScannerProps) {
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera when dialog closes or component unmounts
  useEffect(() => {
    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[QrScanner] Stopped camera track:', track.label);
        });
        streamRef.current = null;
      }
    };

    // When dialog closes, stop the camera
    if (!open) {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [open]);

  // Capture stream reference when camera is accessed
  useEffect(() => {
    if (open && !error && !scanned) {
      // Try to capture the media stream for cleanup
      // The Scanner component creates its own stream, so we need to find it
      const videoElement = document.querySelector('video');
      if (videoElement && videoElement.srcObject) {
        streamRef.current = videoElement.srcObject as MediaStream;
      }
    }
  }, [open, error, scanned]);

  const handleScan = (result: string) => {
    if (scanned) return;

    setScanned(true);
    onScan(result);

    // Close after short delay to show success feedback
    setTimeout(() => {
      onOpenChange(false);
      // Reset state after closing
      setTimeout(() => {
        setScanned(false);
        setError('');
      }, 300);
    }, 800);
  };

  const handleError = (err: unknown) => {
    console.error('QR Scanner error:', err);

    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes('Permission')) {
      setError('Camera permission denied. Please enable camera access in your browser settings.');
      setHasPermission(false);
    } else if (errorMessage.includes('NotFoundError')) {
      setError('No camera found on this device.');
      setHasPermission(false);
    } else {
      setError('Failed to access camera. Please try again.');
    }
  };

  const toggleCamera = () => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
    setTorchOn(false); // Reset torch when switching cameras
  };

  const toggleTorch = () => {
    setTorchOn(prev => !prev);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setScanned(false);
      setError('');
      setTorchOn(false);
    }, 300);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="max-h-[90vh] p-0">
        <ResponsiveDialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <ResponsiveDialogTitle>Scan QR Code</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Point camera at {coinSymbol} address QR code
              </ResponsiveDialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Coin Badge */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-tertiary border border-border/50">
              <Image
                src={getCoinIconPath(coinSymbol)}
                alt={coinSymbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-sm font-semibold">{coinName}</span>
            </div>
          </div>

          {/* Scanner Container */}
          <Card className="relative overflow-hidden bg-black border-bg-tertiary">
            <div className="relative aspect-square w-full">
              {!error && !scanned && (
                <Scanner
                  onScan={(detectedCodes) => {
                    const result = detectedCodes[0]?.rawValue;
                    if (result) {
                      handleScan(result);
                    }
                  }}
                  onError={handleError}
                  constraints={{
                    facingMode: facing,
                  }}
                  components={{
                    torch: torchOn,
                  }}
                  styles={{
                    container: {
                      width: '100%',
                      height: '100%',
                    },
                    video: {
                      objectFit: 'cover',
                    },
                  }}
                  allowMultiple={false}
                />
              )}

              {/* Scanning Overlay */}
              {!error && !scanned && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dark overlay with cutout */}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Scanning frame */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full max-w-[280px] aspect-square">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

                      {/* Scanning line animation */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-scan" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {scanned && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-600">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-semibold">Scanned Successfully!</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary p-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Camera Access Required</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            {!error && !scanned && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleCamera}
                  className="rounded-full w-12 h-12 bg-white/90 hover:bg-white shadow-lg"
                >
                  <SwitchCamera className="h-5 w-5 text-black" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleTorch}
                  className={`rounded-full w-12 h-12 shadow-lg ${
                    torchOn
                      ? 'bg-yellow-400 hover:bg-yellow-500'
                      : 'bg-white/90 hover:bg-white'
                  }`}
                >
                  <Flashlight className={`h-5 w-5 ${torchOn ? 'text-black' : 'text-black'}`} />
                </Button>
              </div>
            )}
          </Card>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {hasPermission === false ? (
                'Camera access is required to scan QR codes. Please enable it in your browser settings.'
              ) : (
                <>
                  Position the QR code within the frame. The address will be detected automatically.
                  {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                    <strong> Note: Camera access requires HTTPS.</strong>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Manual Entry Option */}
          {error && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Enter Address Manually
            </Button>
          )}
        </div>

        {/* Add scanning animation styles */}
        <style jsx>{`
          @keyframes scan {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(280px);
            }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}</style>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
