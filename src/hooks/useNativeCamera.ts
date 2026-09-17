import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface NativePhotoResult {
  file: File | null;
  webPath?: string;
  dataUrl?: string;
  format?: string;
  source: 'native' | 'web';
}

export const useNativeCamera = () => {
  const isNative = Capacitor.isNativePlatform();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Captures a photograph using the native device camera (or web prompt)
   * and returns a standard Web File object suitable for FormData uploads.
   */
  const takePhoto = useCallback(
    async (options?: {
      source?: CameraSource;
      quality?: number;
      fileNamePrefix?: string;
    }): Promise<NativePhotoResult | null> => {
      setLoading(true);
      setError(null);

      const source = options?.source ?? CameraSource.Camera;
      const quality = options?.quality ?? 90;
      const fileNamePrefix = options?.fileNamePrefix ?? 'evidence';

      try {
        if (isNative) {
          // Check & request camera permission on native platform
          const permStatus = await Camera.checkPermissions();
          if (permStatus.camera !== 'granted') {
            const requested = await Camera.requestPermissions({ permissions: ['camera'] });
            if (requested.camera !== 'granted') {
              const msg = 'Camera permission denied. Statutory verification evidence requires camera access.';
              setError(msg);
              setLoading(false);
              return null;
            }
          }

          const image: Photo = await Camera.getPhoto({
            quality,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source,
            saveToGallery: false,
          });

          if (!image.webPath) {
            setLoading(false);
            return null;
          }

          // Fetch the blob from webPath and construct a standard File object
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const format = image.format || 'jpeg';
          const filename = `${fileNamePrefix}-${Date.now()}.${format}`;
          const file = new File([blob], filename, { type: `image/${format}` });

          setLoading(false);
          return {
            file,
            webPath: image.webPath,
            format,
            source: 'native',
          };
        } else {
          // Web fallback: Use hidden input element with capture="environment"
          return new Promise<NativePhotoResult | null>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            // Prefer rear camera on mobile web browsers
            input.capture = 'environment';

            input.onchange = async () => {
              const selectedFile = input.files?.[0];
              if (selectedFile) {
                const webPath = URL.createObjectURL(selectedFile);
                setLoading(false);
                resolve({
                  file: selectedFile,
                  webPath,
                  format: selectedFile.type.split('/')[1] || 'jpeg',
                  source: 'web',
                });
              } else {
                setLoading(false);
                resolve(null);
              }
            };

            input.oncancel = () => {
              setLoading(false);
              resolve(null);
            };

            input.click();
          });
        }
      } catch (err: any) {
        setLoading(false);
        const errMessage = err?.message || String(err);
        // User cancelled camera dialog is a standard user action, not a hard crash
        if (
          errMessage.toLowerCase().includes('cancel') ||
          errMessage.toLowerCase().includes('user cancelled') ||
          errMessage.toLowerCase().includes('dismiss')
        ) {
          return null;
        }
        setError(errMessage || 'Failed to capture statutory photograph.');
        return null;
      }
    },
    [isNative]
  );

  return {
    takePhoto,
    loading,
    error,
    isNative,
    clearError: () => setError(null),
  };
};
