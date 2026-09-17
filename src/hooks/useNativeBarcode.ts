import { useState, useCallback } from 'react';
import {
  BarcodeScanner,
  BarcodeFormat,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export interface NativeBarcodeScanResult {
  rawValue: string;
  format?: string;
  success: boolean;
}

/**
 * Utility to parse either a raw token or full verification URL
 * into the primary certificate or verification token.
 */
export const parseQrCertificateToken = (scannedText: string): string => {
  const raw = (scannedText || '').trim();
  if (!raw) return '';

  try {
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('/verify/')) {
      const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://emaap.gov.in');
      const searchToken = url.searchParams.get('token') || url.searchParams.get('certificateNo');
      if (searchToken) return searchToken.trim();

      const pathSegments = url.pathname.split('/').filter(Boolean);
      const verifyIndex = pathSegments.indexOf('verify');
      if (verifyIndex !== -1 && pathSegments[verifyIndex + 1]) {
        return pathSegments[verifyIndex + 1].trim();
      }
      if (pathSegments.length > 0) {
        return pathSegments[pathSegments.length - 1].trim();
      }
    }
  } catch {
    // Return raw text if URL parsing fails
  }

  return raw;
};

export const useNativeBarcode = () => {
  const isNative = Capacitor.isNativePlatform();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Checks if Google Barcode Scanner / MLKit module is available and ready on native
   */
  const prepareScanner = useCallback(async (): Promise<boolean> => {
    if (!isNative) return true;
    try {
      const isAvailable = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!isAvailable.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      }
      return true;
    } catch {
      // Continue even if check fails, scan() will attempt execution
      return true;
    }
  }, [isNative]);

  /**
   * Performs an immediate native barcode scan or requests permission.
   * On native, this launches the system/Google Barcode Scanner sheet or overlay.
   */
  const scan = useCallback(async (): Promise<NativeBarcodeScanResult | null> => {
    setScanning(true);
    setError(null);

    try {
      if (isNative) {
        // Check camera permissions
        const perm = await BarcodeScanner.checkPermissions();
        if (perm.camera !== 'granted') {
          const requested = await BarcodeScanner.requestPermissions();
          if (requested.camera !== 'granted') {
            const msg = 'Camera access denied for barcode scanning.';
            setError(msg);
            setScanning(false);
            return null;
          }
        }

        await prepareScanner();

        // Native scan with Google Barcode Scanner UI
        const result = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode, BarcodeFormat.Code128, BarcodeFormat.DataMatrix],
        });

        setScanning(false);

        if (result.barcodes && result.barcodes.length > 0) {
          const barcode = result.barcodes[0];
          return {
            rawValue: barcode.rawValue || barcode.displayValue || '',
            format: barcode.format,
            success: true,
          };
        }

        return null;
      } else {
        // On web, signal that the component should show the web scanner interface
        setScanning(false);
        return null;
      }
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message || String(err);
      if (
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('user cancelled') ||
        msg.toLowerCase().includes('dismiss')
      ) {
        return null;
      }
      setError(msg || 'Failed to scan QR code.');
      return null;
    }
  }, [isNative, prepareScanner]);

  return {
    scan,
    scanning,
    error,
    isNative,
    clearError: () => setError(null),
    parseToken: parseQrCertificateToken,
  };
};
