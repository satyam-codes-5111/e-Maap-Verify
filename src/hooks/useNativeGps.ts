import { useState, useCallback } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface NativeGpsCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export const useNativeGps = () => {
  const isNative = Capacitor.isNativePlatform();
  const [coordinates, setCoordinates] = useState<NativeGpsCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Captures the current device GPS position across native Android/iOS
   * and standard browser environments with appropriate permissions handling.
   */
  const getCurrentPosition = useCallback(async (): Promise<NativeGpsCoordinates | null> => {
    setLoading(true);
    setError(null);

    try {
      if (isNative) {
        // Native Capacitor Geolocation
        const permStatus: PermissionStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
          const requested = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
          if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
            const msg = 'Location access denied. Legal Metrology verification requires verified site GPS.';
            setError(msg);
            setLoading(false);
            return null;
          }
        }

        const position: Position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        });

        const result: NativeGpsCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        };

        setCoordinates(result);
        setLoading(false);
        return result;
      } else {
        // Standard Web Navigator Geolocation
        if (!navigator.geolocation) {
          setError('Browser geolocation is not supported on this device.');
          setLoading(false);
          return null;
        }

        return new Promise<NativeGpsCoordinates | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const result: NativeGpsCoordinates = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracyMeters: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
                timestamp: pos.timestamp,
              };
              setCoordinates(result);
              setLoading(false);
              resolve(result);
            },
            (err) => {
              setLoading(false);
              let msg = 'Unable to determine GPS location.';
              if (err.code === 1) {
                msg = 'Location permission was denied. Please enable GPS permissions.';
              } else if (err.code === 2) {
                msg = 'Location position unavailable. Check device GPS reception.';
              } else if (err.code === 3) {
                msg = 'Location acquisition timed out. Please try again.';
              }
              setError(msg);
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 3000,
            }
          );
        });
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Failed to acquire statutory GPS coordinates.';
      setError(msg);
      return null;
    }
  }, [isNative]);

  return {
    coordinates,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    accuracyMeters: coordinates?.accuracyMeters,
    loading,
    error,
    isNative,
    getCurrentPosition,
    clearError: () => setError(null),
    setManualCoordinates: (lat: number, lon: number, accuracy?: number) => {
      setCoordinates({
        latitude: lat,
        longitude: lon,
        accuracyMeters: accuracy,
        timestamp: Date.now(),
      });
    },
  };
};
