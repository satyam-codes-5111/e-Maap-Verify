import { useState, useEffect, useCallback } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export interface NativeNetworkStatus {
  connected: boolean;
  connectionType: string;
  isNative: boolean;
}

export const useNativeNetwork = () => {
  const isNative = Capacitor.isNativePlatform();
  const [status, setStatus] = useState<NativeNetworkStatus>({
    connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    isNative,
  });

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    if (isNative) {
      Network.getStatus().then((netStatus: ConnectionStatus) => {
        setStatus({
          connected: netStatus.connected,
          connectionType: netStatus.connectionType,
          isNative: true,
        });
      }).catch(() => {
        // Fallback to navigator
        setStatus({
          connected: navigator.onLine,
          connectionType: 'unknown',
          isNative: true,
        });
      });

      const handlePromise = Network.addListener('networkStatusChange', (netStatus: ConnectionStatus) => {
        setStatus({
          connected: netStatus.connected,
          connectionType: netStatus.connectionType,
          isNative: true,
        });
      });

      handlePromise.then((handle) => {
        removeListener = () => handle.remove();
      });
    } else {
      const handleOnline = () => {
        setStatus((prev) => ({ ...prev, connected: true }));
      };
      const handleOffline = () => {
        setStatus((prev) => ({ ...prev, connected: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      removeListener = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [isNative]);

  const checkStatus = useCallback(async (): Promise<NativeNetworkStatus> => {
    if (isNative) {
      try {
        const netStatus = await Network.getStatus();
        const current: NativeNetworkStatus = {
          connected: netStatus.connected,
          connectionType: netStatus.connectionType,
          isNative: true,
        };
        setStatus(current);
        return current;
      } catch {
        const fallback: NativeNetworkStatus = {
          connected: navigator.onLine,
          connectionType: 'unknown',
          isNative: true,
        };
        setStatus(fallback);
        return fallback;
      }
    } else {
      const current: NativeNetworkStatus = {
        connected: navigator.onLine,
        connectionType: 'unknown',
        isNative: false,
      };
      setStatus(current);
      return current;
    }
  }, [isNative]);

  return {
    ...status,
    checkStatus,
  };
};
