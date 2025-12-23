'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileImage, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DocumentUploaderProps {
  label: string;
  description?: string;
  accept?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DocumentUploader({
  label,
  description,
  accept = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle video stream setup
  useEffect(() => {
    if (!isCapturing || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    videoRef.current.muted = true;

    const attemptPlay = () => {
      if (!videoRef.current) return;

      videoRef.current.play().then(() => {
        setCameraReady(true);
      }).catch(() => {
        setTimeout(attemptPlay, 500);
      });
    };

    attemptPlay();

    videoRef.current.onloadedmetadata = () => attemptPlay();
    videoRef.current.oncanplay = () => attemptPlay();
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      setCameraReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      alert('Unable to access camera. Please grant camera permissions.');
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
      alert('Camera is not ready. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], 'document.jpg', { type: 'image/jpeg' });
      handleFile(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
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

    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.some(type => file.type.includes(type.replace('image/', '').replace('application/', '')))) {
      alert('Invalid file type');
      return;
    }

    onChange(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
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

  // Initial state - upload area
  if (!isCapturing && !value) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/40',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500'
          )}
        >
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-muted p-3">
                <FileImage className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <p className="text-sm font-medium mb-1">Upload Document</p>
            <p className="text-xs text-muted-foreground mb-4">
              Drag and drop or choose from device
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                size="sm"
                onClick={startCamera}
                disabled={disabled}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground mt-4">
              Max size: 10MB • Formats: JPG, PNG, WEBP, PDF
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Camera capture state
  if (isCapturing) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative rounded-lg overflow-hidden bg-black max-w-2xl mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto bg-black"
          />

          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-sm">Loading camera...</p>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-primary/30 rounded-lg w-5/6 h-5/6" />
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
              Frame your document and tap to capture
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Preview state
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative rounded-lg border border-border bg-muted/40 overflow-hidden max-w-2xl mx-auto">
        {preview ? (
          <div className="relative aspect-video w-full">
            <Image
              src={preview}
              alt="Document preview"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-3">
              <FileImage className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{value?.name}</p>
              <p className="text-xs text-muted-foreground">
                {value && (value.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        {!disabled && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="rounded-full bg-white/90 backdrop-blur-sm p-2 hover:bg-white transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-black" />
            </button>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-full bg-white/90 backdrop-blur-sm p-2 hover:bg-white transition-colors"
            >
              <X className="h-4 w-4 text-black" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}