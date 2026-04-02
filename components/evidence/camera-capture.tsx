'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, RotateCw } from 'lucide-react';

interface CaptureMetadata {
  capturedAt: string;
  deviceInfo: string;
  latitude?: number;
  longitude?: number;
}

interface CameraCaptureProps {
  onCapture: (file: File, metadata: CaptureMetadata) => void;
  onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment',
  );
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      // Camera not available
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const acceptPhoto = useCallback(async () => {
    if (!preview) return;

    // Convert data URL to File
    const res = await fetch(preview);
    const blob = await res.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    // Gather metadata
    const metadata: CaptureMetadata = {
      capturedAt: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
    };

    // Try GPS
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          }),
        );
        metadata.latitude = pos.coords.latitude;
        metadata.longitude = pos.coords.longitude;
      } catch {
        // GPS not available — continue without
      }
    }

    onCapture(file, metadata);
    setPreview(null);
  }, [preview, onCapture]);

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    // Will restart on next render
    setTimeout(startCamera, 100);
  };

  return (
    <div className="relative" data-testid="camera-capture">
      {!streaming && !preview && (
        <button
          onClick={startCamera}
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <Camera className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Open Camera</span>
        </button>
      )}

      {streaming && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video ref={videoRef} className="w-full" autoPlay playsInline muted />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              onClick={takePhoto}
              className="p-4 rounded-full bg-white hover:bg-gray-100 border-2 border-gray-300"
              data-testid="btn-capture"
            >
              <Camera className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={() => {
                stopCamera();
                onCancel?.();
              }}
              className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative rounded-lg overflow-hidden">
          <img src={preview} alt="Captured" className="w-full" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={retake}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-black/50 text-white hover:bg-black/70"
            >
              <RotateCw className="h-4 w-4" /> Retake
            </button>
            <button
              onClick={acceptPhoto}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="btn-accept"
            >
              <Check className="h-4 w-4" /> Use Photo
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
