import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  X,
  RefreshCw,
  Upload,
  Search,
  Sparkles,
  Zap,
  ZapOff,
  AlertCircle,
  HelpCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useNativeBarcode, parseQrCertificateToken } from '../../hooks/useNativeBarcode';

interface OfficerQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  isLoading?: boolean;
}

export const OfficerQrScannerModal: React.FC<OfficerQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  isLoading = false,
}) => {
  const { scan: nativeScan, isNative } = useNativeBarcode();

  const [manualInput, setManualInput] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef(false);

  // Play auditory & haptic feedback on successful scan
  const triggerSuccessFeedback = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Ignore audio error
    }

    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {
      // Ignore vibration error
    }
  }, []);

  const handleDetectedCode = useCallback(
    (codeText: string) => {
      const clean = codeText.trim();
      if (!clean) return;

      setLastScannedValue(clean);
      triggerSuccessFeedback();
      stopCamera();
      onScanSuccess(clean);
    },
    [onScanSuccess, triggerSuccessFeedback]
  );

  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  const startDecodingLoop = useCallback(() => {
    isScanningActiveRef.current = true;

    // Check BarcodeDetector capability
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector: any = null;
    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'data_matrix'],
        });
      } catch {
        detector = null;
      }
    }

    const scanFrame = async () => {
      if (!isScanningActiveRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Fast path: BarcodeDetector if supported
      if (detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetectedCode(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall through to jsQR
        }
      }

      // High-compatibility path: jsQR canvas decoder
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          const vWidth = video.videoWidth;
          const vHeight = video.videoHeight;

          if (vWidth > 0 && vHeight > 0) {
            // Downscale slightly for speed if frame is very large (e.g. 4K)
            const maxDim = 800;
            let targetW = vWidth;
            let targetH = vHeight;

            if (vWidth > maxDim || vHeight > maxDim) {
              const ratio = Math.min(maxDim / vWidth, maxDim / vHeight);
              targetW = Math.round(vWidth * ratio);
              targetH = Math.round(vHeight * ratio);
            }

            canvas.width = targetW;
            canvas.height = targetH;
            ctx.drawImage(video, 0, 0, targetW, targetH);

            const imageData = ctx.getImageData(0, 0, targetW, targetH);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrCode && qrCode.data) {
              handleDetectedCode(qrCode.data);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Frame decoding error:', err);
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetectedCode]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      setScannerError(null);
      setIsStartingCamera(true);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerError('Camera access is not supported on this browser or connection.');
        setIsStartingCamera(false);
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        // Check if torch/flashlight is supported on video track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
          setTorchSupported(Boolean(capabilities.torch));
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setIsStartingCamera(false);
          startDecodingLoop();
        }
      } catch (err: any) {
        console.warn('getUserMedia ideal failed, attempting generic constraint:', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setIsStartingCamera(false);
            startDecodingLoop();
          }
        } catch (fallbackErr: any) {
          setIsStartingCamera(false);
          if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
            setScannerError(
              'Camera permission was denied. Please allow camera permissions in browser settings, or enter the ID manually.'
            );
          } else {
            setScannerError(
              'Unable to access camera hardware. Check device permissions or upload a QR image.'
            );
          }
        }
      }
    },
    [facingMode, startDecodingLoop, stopCamera]
  );

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Launch Native MLKit Scanner sheet (Capacitor Android)
  const handleLaunchNativeScanner = async () => {
    try {
      const result = await nativeScan();
      if (result && result.rawValue) {
        handleDetectedCode(result.rawValue);
      }
    } catch (err: any) {
      console.warn('Native MLKit scan failed:', err);
      // Fallback to web camera
      startCamera();
    }
  };

  // Handle image upload with jsQR
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setScannerError('Could not initialize image processing canvas.');
          return;
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          setScannerError(
            'No valid Legal Metrology QR code detected in the selected image. Please ensure the QR is in focus and well lit.'
          );
        }
      };
      img.onerror = () => {
        setScannerError('Failed to load image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDetectedCode(manualInput.trim());
  };

  // Start/Stop camera on modal open/close and tab changes
  useEffect(() => {
    if (isOpen) {
      setScannerError(null);
      setLastScannedValue(null);

      // On Android native, attempt MLKit scanner immediately or offer button
      if (isNative) {
        handleLaunchNativeScanner();
      } else if (activeTab === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, isNative]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-[#123B6D] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FF9933]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Field QR Inspector</h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Legal Metrology Physical Sticker & Certificate Scanner
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'camera'
                ? 'border-[#123B6D] text-[#123B6D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-[#123B6D] text-[#123B6D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'manual'
                ? 'border-[#123B6D] text-[#123B6D] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual ID</span>
          </button>
        </div>

        {/* Main Scanner Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {/* Native Android Barcode Scanner Prompt */}
              {isNative && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#123B6D]" />
                    <span className="text-xs font-bold text-[#123B6D]">Android MLKit Camera Available</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLaunchNativeScanner}
                    className="px-2.5 py-1 text-xs font-bold bg-[#123B6D] text-white rounded-lg hover:bg-[#0D2B4F] transition"
                  >
                    Open Sheet
                  </button>
                </div>
              )}

              {/* Viewfinder Canvas */}
              <div className="relative w-full aspect-square max-h-[300px] sm:max-h-[340px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Laser Targeting Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-white/60 rounded-2xl flex items-center justify-center">
                    {/* 4 Framing Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#FF9933] rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#FF9933] rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#138808] rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#138808] rounded-br-lg" />

                    {/* Animated Scanning Sweep Beam */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#FF9933] to-transparent shadow-[0_0_8px_#FF9933] animate-pulse" />

                    <div className="text-[10px] font-bold tracking-wider text-white/80 bg-black/60 px-2 py-0.5 rounded-full uppercase">
                      Align QR in frame
                    </div>
                  </div>
                </div>

                {/* Overlay Controls (Torch, Facing Mode) */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                  {torchSupported ? (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md transition ${
                        torchOn ? 'bg-amber-400 text-slate-900' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                      title="Toggle Flashlight / Torch"
                    >
                      {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}

                  <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                    Auto-Detecting
                  </span>

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition"
                    title="Switch Camera (Front/Rear)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Loading indicator */}
                {isStartingCamera && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#FF9933]" />
                    <span className="text-xs font-semibold">Starting camera feed...</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Point camera directly at the QR code on the physical instrument seal, inspection plate, or verification certificate.
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / SNAP PHOTO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-[#123B6D] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#123B6D] flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Upload or Snap a Photo
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mb-3">
                  Select a photo of the instrument serial plate, stamp sticker, or certificate QR code.
                </p>
                <span className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#123B6D] rounded-lg shadow-xs">
                  Choose Image File
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL ID / SERIAL NUMBER ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instrument ID, Serial Number, or Certificate Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. INS-2026-102938, SN-98722, or DOCA-CERT-..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent font-medium"
                    autoFocus
                  />
                  {manualInput && (
                    <button
                      type="button"
                      onClick={() => setManualInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Accepts Instrument ID (INS-...), physical serial numbers, application numbers, or certificate tokens.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualInput.trim() || isLoading}
                className="w-full py-2.5 px-4 bg-[#123B6D] hover:bg-[#0D2B4F] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Fetch Instrument Details</span>
              </button>
            </form>
          )}

          {/* Error Banner */}
          {scannerError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Scanning Notice</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{scannerError}</p>
              </div>
            </div>
          )}

          {/* Quick Demo Test Pills */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF9933]" />
                <span>Quick Test Queries (Simulation)</span>
              </span>
              <span className="text-[10px] text-slate-400">Tap to instantly fetch</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Sample Balance (INST-PH8-001)', code: 'INST-PH8-001' },
                { label: 'Serial (SN-PH8-PASS-001)', code: 'SN-PH8-PASS-001' },
                { label: 'Fuel Dispenser (FD-SN-8849)', code: 'FD-SN-8849' },
                { label: 'Weighbridge (WB-2026-0041)', code: 'WB-2026-0041' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleDetectedCode(sample.code)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Legal Metrology Act, 2009 Standards</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
