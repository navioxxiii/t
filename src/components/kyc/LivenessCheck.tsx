'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LivenessCheckProps {
  label: string;
  description?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function LivenessCheck({
  label,
  description,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: LivenessCheckProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle video stream setup when video element is available and isCapturing changes
  useEffect(() => {
    if (!isCapturing || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    videoRef.current.muted = true;

    const attemptPlay = () => {
      if (!videoRef.current) {
        return;
      }

      videoRef.current.play().then(() => {
        setCameraReady(true);
      }).catch((playErr) => {
        setTimeout(attemptPlay, 500);
      });
    };

    attemptPlay();

    videoRef.current.onloadedmetadata = () => {
      attemptPlay();
    };

    videoRef.current.oncanplay = () => {
      attemptPlay();
    };
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      setCameraReady(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please grant camera permissions or upload a photo instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      alert('Video is not ready. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image (as it would appear to the user)
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      handleFile(file);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }

    onChange(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const clearFile = () => {
    handleFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const retake = () => {
    clearFile();
    startCamera();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {!isCapturing && !value ? (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed bg-muted/40 transition-all',
            error ? 'border-red-500' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-muted p-3">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <p className="text-sm font-medium mb-1">Take a Selfie</p>
            <p className="text-xs text-muted-foreground mb-4">
              Look directly at the camera with good lighting
            </p>

            <div className="bg-muted rounded-lg p-3 mb-4 text-left">
              <p className="text-xs font-medium mb-2">Tips for a good selfie:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Face the camera directly with a neutral expression</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Ensure good lighting (avoid shadows)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Remove glasses or hats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Make sure your entire face is visible</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                onClick={startCamera}
                disabled={disabled}
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>

              {/* TODO: Re-enable photo upload when ready */}
              {/*  */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Upload Photo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />
          </div>
        </div>
      ) : isCapturing ? (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4] max-w-md mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onClick={() => {
              console.log('[LivenessCheck] Video clicked', { cameraReady, readyState: videoRef.current?.readyState });
              if (videoRef.current && !cameraReady) {
                console.log('[LivenessCheck] Attempting manual play from click');
                videoRef.current.play().then(() => {
                  console.log('[LivenessCheck] Manual play successful');
                  setCameraReady(true);
                }).catch(e => console.error('[LivenessCheck] Manual play failed:', e.name, e.message));
              }
            }}
            className="w-full h-full object-cover cursor-pointer"
            style={{ transform: 'scaleX(-1)' }}
          />

          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-sm">Loading camera...</p>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-80 rounded-full border-4 border-primary/50" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-center items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopCamera}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="rounded-full w-16 h-16 bg-white hover:bg-gray-200"
              >
                <Camera className="h-8 w-8 text-black" />
              </Button>

              <div className="w-10" />
            </div>

            <p className="text-center text-white text-xs mt-2">
              Position your face in the oval and tap to capture
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-border bg-muted/40 overflow-hidden max-w-md mx-auto">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={preview || ''}
              alt="Selfie preview"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute top-3 right-3 rounded-full bg-green-600/90 backdrop-blur-sm p-2">
            <Check className="h-4 w-4 text-white" />
          </div>

          {!disabled && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retake}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFile}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
