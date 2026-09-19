import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import heroimage from "./images/image3.png"
import {
  ShieldCheck,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck2,
  Scale,
  Building2,
  CalendarDays,
  UserCheck,
  MapPin,
  Download,
  ArrowLeft,
  Camera,
  X,
  Upload,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { certificateApi } from '../../services/certificateApi';
import { useNativeBarcode } from '../../hooks/useNativeBarcode';
import { useNativeNetwork } from '../../hooks/useNativeNetwork';

interface CertificateData {
  certificateNo?: string;
  certificateNumber?: string;
  instrumentType?: string;
  instrumentName?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  businessName?: string;
  ownerName?: string;
  applicantName?: string;
  verificationDate?: string;
  validUntil?: string;
  status?: string;
  officerName?: string;
  officerDesignation?: string;
  location?: string;
  district?: string;
  state?: string;
  qrToken?: string;
  pdfUrl?: string;
}

type VerifyState = 'idle' | 'loading' | 'verified' | 'invalid' | 'error';

export const VerifyCertificatePage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const initialToken =
    searchParams.get('token') ||
    searchParams.get('certificateNo') ||
    '';

  const [token, setToken] = useState(initialToken);
  const [verifyState, setVerifyState] = useState<VerifyState>(
    initialToken ? 'loading' : 'idle'
  );
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [message, setMessage] = useState('');

  // Native Adapters
  const { scan: nativeScan, isNative: isNativePlatform } = useNativeBarcode();
  const { connected: isOnline } = useNativeNetwork();

  // QR Scanning States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const verifyCertificate = async (value?: string) => {
    const verificationToken = (value ?? token).trim();

    if (!verificationToken) {
      setVerifyState('error');
      setMessage('Please enter a Certificate Number or QR Verification Token.');
      setCertificate(null);
      return;
    }

    if (!isOnline) {
      setVerifyState('error');
      setMessage('No active network connection detected. Verification requires an active internet connection to query the official central repository.');
      setCertificate(null);
      return;
    }

    setVerifyState('loading');
    setMessage('');
    setCertificate(null);

    try {
      // First try standard POST /api/certificates/verify
      let data: any = null;
      let isSuccess = false;

      try {
        const response = await api.post('/certificates/verify', {
          token: verificationToken,
          certificateNo: verificationToken,
          certificateNumber: verificationToken,
        });
        if (response.data && response.data.success !== false) {
          data = response.data;
          isSuccess = true;
        }
      } catch {
        // Fallback to public GET verification endpoint below
      }

      // If POST was not successful or unauthorized, use public verification service
      if (!isSuccess) {
        try {
          const publicRes: any = await certificateApi.verifyPublic(verificationToken);
          if (publicRes?.success && publicRes?.data) {
            data = publicRes;
            isSuccess = true;
          } else if (publicRes?.certificateNumber || publicRes?.data?.certificateNumber) {
            data = publicRes?.data ? publicRes : { data: publicRes };
            isSuccess = true;
          }
        } catch (pubErr: any) {
          const errMsg = pubErr?.response?.data?.message || pubErr?.message;
          if (errMsg) {
            setMessage(errMsg);
          }
        }
      }

      if (isSuccess && data) {
        const raw = data?.data || data?.certificate || data;

        // Normalize data to CertificateData structure
        const normalized: CertificateData = {
          certificateNo: raw.certificateNumber || raw.certificateNo,
          certificateNumber: raw.certificateNumber || raw.certificateNo,
          instrumentType: raw.instrument?.instrumentType || raw.instrument?.category || raw.instrumentType,
          instrumentName: raw.instrument?.instrumentType || raw.instrumentName,
          manufacturer: raw.instrument?.manufacturer || raw.manufacturer,
          model: raw.instrument?.modelNumber || raw.model,
          serialNumber: raw.instrument?.serialNumber || raw.serialNumber,
          businessName: raw.stakeholder?.businessName || raw.businessName,
          ownerName: raw.stakeholder?.businessName || raw.ownerName,
          applicantName: raw.stakeholder?.businessName || raw.applicantName,
          verificationDate: raw.verificationDate || raw.validFrom || raw.issuedAt,
          validUntil: raw.validUntil,
          status: raw.certificateStatus || raw.status || (raw.isValid ? 'ACTIVE' : 'EXPIRED'),
          officerName: raw.officer?.name || raw.issuedBy?.name || raw.officerName,
          officerDesignation: raw.officer?.designation || raw.issuedBy?.designation || raw.officerDesignation,
          location: raw.instrument?.premiseLocation || raw.location,
          district: raw.stakeholder?.district || raw.officer?.jurisdiction || raw.district,
          state: raw.stakeholder?.state || raw.state,
          qrToken: raw.qrCodeToken || raw.qrToken || verificationToken,
          pdfUrl: raw.verificationUrl || raw.certificateUrl || raw.pdfUrl || (raw._id ? `/api/certificates/${raw._id}/download` : undefined),
        };

        if (
          normalized.certificateNo ||
          normalized.certificateNumber ||
          normalized.serialNumber ||
          normalized.instrumentType ||
          normalized.businessName
        ) {
          setCertificate(normalized);
          setVerifyState('verified');
          return;
        }
      }

      setVerifyState('invalid');
      setMessage((prev) => prev || 'No valid certificate record was found matching this token or certificate number.');
    } catch (error) {
      console.error('Certificate verification error:', error);
      setVerifyState('error');
      setMessage(
        'Unable to connect to the verification service. Please try again.'
      );
    }
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (initialToken) {
      verifyCertificate(initialToken);
    }
  }, []);

  const extractTokenFromQrText = (text: string): string => {
    const raw = text.trim();
    if (!raw) return '';

    // Check if it's a URL
    try {
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('/verify/')) {
        const url = new URL(raw, window.location.origin);
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
      // Not a valid URL, treat as raw token/certificate number
    }

    return raw;
  };

  const handleScanSuccess = (scannedRaw: string) => {
    const extracted = extractTokenFromQrText(scannedRaw);
    if (extracted) {
      stopCamera();
      setIsScannerOpen(false);
      setToken(extracted);
      verifyCertificate(extracted);
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode = facingMode) => {
    setScannerError(null);
    setIsStartingCamera(true);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerError('Camera access is not supported on this browser or connection.');
      setIsStartingCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsStartingCamera(false);
        startDecodingLoop();
      }
    } catch (err: any) {
      console.warn('getUserMedia failed:', err);
      // Try relaxed constraint without facingMode
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
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
          setScannerError('Camera permission was denied. Please allow camera access in your browser settings, or upload an image of the QR code.');
        } else {
          setScannerError('Unable to start camera. Please verify device camera access or upload an image.');
        }
      }
    }
  };

  const startDecodingLoop = () => {
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('BarcodeDetector instantiation failed:', e);
      }
    }

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameIdRef.current = requestAnimationFrame(tick);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const qrVal = barcodes[0].rawValue;
            if (qrVal) {
              handleScanSuccess(qrVal);
              return;
            }
          }
        } catch {
          // Ignore intermittent detector errors
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScannerError(null);

    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    if (hasBarcodeDetector) {
      try {
        const imageBitmap = await createImageBitmap(file);
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(imageBitmap);

        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          handleScanSuccess(barcodes[0].rawValue);
          return;
        } else {
          setScannerError('No QR code detected in the selected image. Please try a clearer picture or enter the token manually.');
          return;
        }
      } catch (err: any) {
        console.warn('Image barcode detection error:', err);
      }
    }

    setScannerError('Automated image decoding is not natively supported in this browser. Please use the live camera or type the verification token manually.');
  };

  const openScanner = async () => {
    if (isNativePlatform) {
      try {
        const scanResult = await nativeScan();
        if (scanResult && scanResult.rawValue) {
          handleScanSuccess(scanResult.rawValue);
          return;
        }
      } catch (err: any) {
        console.warn('Native barcode scan failed, falling back to camera modal:', err);
      }
    }

    // Web environment or native fallback
    setIsScannerOpen(true);
    setScannerError(null);
  };

  const closeScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
    setScannerError(null);
  };

  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    verifyCertificate();
  };

  const clearVerification = () => {
    setToken('');
    setCertificate(null);
    setMessage('');
    setVerifyState('idle');
  };

  const getValue = (...values: Array<string | undefined>) => {
    return values.find((value) => value && value.trim()) || '—';
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const downloadCertificate = () => {
    if (!certificate?.pdfUrl) return;

    window.open(certificate.pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800 flex flex-col font-sans">
      {/* TOP GOVERNMENT BAR */}
      <div className="bg-[#123b6d] text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <span className="font-semibold">
                Government of India
              </span>
              <span className="hidden sm:inline opacity-50">|</span>
              <span className="text-blue-100">
                Department of Consumer Affairs
              </span>
            </div>

            <div className="text-blue-100">
              Legal Metrology
            </div>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
     
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#123b6d] flex items-center justify-center shrink-0">
                <Scale className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Department of Consumer Affairs
                </p>

                <h1 className="text-lg sm:text-2xl font-extrabold text-[#123b6d] truncate">
                  e-Maap Verify
                </h1>

                <p className="text-[10px] sm:text-xs text-slate-600">
                  Online Certificate Verification System
                </p>
              </div>
            </div>

          </div>
        </div>
      
      </header>

      {/* NAVIGATION */}
      <nav className="bg-[#123b6d] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto">
            <Link
              to="/"
              className="px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold hover:bg-white/10 whitespace-nowrap"
            >
              Home
            </Link>

            <span className="px-4 sm:px-5 py-3 bg-[#0b6eb7] text-xs sm:text-sm font-semibold whitespace-nowrap">
              Certificate Verification
            </span>

            <Link
              to="/login"
              className="px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold hover:bg-white/10 whitespace-nowrap"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1">
        {/* PAGE TITLE */}
        {/* PAGE TITLE — RESPONSIVE BACKGROUND IMAGE */}
<section
  className="relative overflow-hidden border-b border-slate-200 bg-cover bg-center"
  style={{ backgroundImage: `url(${heroimage})` }}
>
  {/* Responsive overlay */}
  <div className="absolute inset-0 bg-white/70 sm:bg-white/65 lg:bg-white/60" />

  {/* Government blue tint */}
  <div className="absolute inset-0 bg-gradient-to-r from-[#edf6ff]/80 via-white/45 to-[#f1f8f2]/60" />

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-14">
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 bg-white/95 border border-blue-200 text-[#123b6d] rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm mb-4">
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Public Verification Service</span>
      </div>

      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#123b6d] leading-tight tracking-tight">
        Verify Legal Metrology Certificate
      </h2>

      <p className="mt-3 sm:mt-4 max-w-3xl text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed">
        Verify the authenticity and validity of a weighing or measuring
        instrument certificate issued through the Legal Metrology system.
      </p>
    </div>
  </div>
</section>

        {/* VERIFICATION AREA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8">
            {/* LEFT */}
            <div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 sm:px-7 py-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#123b6d] text-white flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#123b6d] text-base sm:text-lg">
                        Certificate Verification
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500">
                        Enter the certificate number or QR verification token.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <form onSubmit={handleSubmit}>
                    <label
                      htmlFor="certificate-token"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Certificate Number / QR Verification Token
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />

                        <input
                          id="certificate-token"
                          type="text"
                          value={token}
                          onChange={(event) => setToken(event.target.value)}
                          placeholder="Enter certificate number or verification token"
                          className="w-full h-12 pl-11 pr-4 border border-slate-300 rounded-md bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#07549a]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={openScanner}
                        className="h-12 px-5 bg-white hover:bg-slate-50 border border-[#07549a] text-[#07549a] rounded-md font-bold text-sm flex items-center justify-center gap-2 transition hover:shadow-sm"
                        title="Scan QR Code with Camera or Upload Image"
                      >
                        <Camera className="w-4 h-4" />
                        Scan QR
                      </button>

                      <button
                        type="submit"
                        disabled={verifyState === 'loading'}
                        className="h-12 px-6 bg-[#07549a] hover:bg-[#063f73] text-white rounded-md font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                      >
                        {verifyState === 'loading' ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Verify Certificate
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        The verification token can be obtained from the QR code printed on the physical or digital certificate.
                      </span>
                      <button
                        type="button"
                        onClick={openScanner}
                        className="text-[#07549a] hover:underline font-semibold inline-flex items-center gap-1 shrink-0 ml-2"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Open Scanner
                      </button>
                    </div>
                  </form>

                  {/* ERROR */}
                  {(verifyState === 'error' || verifyState === 'invalid') && (
                    <div
                      className={`mt-6 rounded-lg border p-4 flex items-start gap-3 ${
                        verifyState === 'invalid'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      {verifyState === 'invalid' ? (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <p
                          className={`font-bold text-sm ${
                            verifyState === 'invalid'
                              ? 'text-red-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {verifyState === 'invalid'
                            ? 'Certificate Not Verified'
                            : 'Verification Error'}
                        </p>

                        <p
                          className={`text-xs sm:text-sm mt-1 ${
                            verifyState === 'invalid'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message || '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VERIFIED */}
                  {verifyState === 'verified' && certificate && (
                    <div className="mt-6">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />

                        <div className="flex-1">
                          <h3 className="font-extrabold text-green-800 text-base sm:text-lg">
                            Certificate Verified Successfully
                          </h3>

                          <p className="text-xs sm:text-sm text-green-700 mt-1">
                            The certificate record has been successfully
                            verified against the Legal Metrology system.
                          </p>
                        </div>
                      </div>

                      {/* CERTIFICATE DETAILS */}
                      <div className="mt-5 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-4 sm:px-5 py-3 bg-[#123b6d] text-white">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5" />
                            <h3 className="font-bold text-sm sm:text-base">
                              Certificate Details
                            </h3>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                            <DetailItem
                              icon={<FileCheck2 />}
                              label="Certificate Number"
                              value={getValue(
                                certificate.certificateNo,
                                certificate.certificateNumber
                              )}
                            />

                            <DetailItem
                              icon={<CheckCircle2 />}
                              label="Status"
                              value={getValue(
                                certificate.status,
                                'VERIFIED'
                              )}
                              valueClass="text-green-700 font-bold"
                            />

                            <DetailItem
                              icon={<Scale />}
                              label="Instrument Type"
                              value={getValue(
                                certificate.instrumentType,
                                certificate.instrumentName
                              )}
                            />

                            <DetailItem
                              icon={<Building2 />}
                              label="Manufacturer"
                              value={getValue(certificate.manufacturer)}
                            />

                            <DetailItem
                              icon={<FileCheck2 />}
                              label="Model"
                              value={getValue(certificate.model)}
                            />

                            <DetailItem
                              icon={<QrCode />}
                              label="Serial Number"
                              value={getValue(certificate.serialNumber)}
                            />

                            <DetailItem
                              icon={<Building2 />}
                              label="Business / Applicant"
                              value={getValue(
                                certificate.businessName,
                                certificate.ownerName,
                                certificate.applicantName
                              )}
                            />

                            <DetailItem
                              icon={<CalendarDays />}
                              label="Verification Date"
                              value={formatDate(
                                certificate.verificationDate
                              )}
                            />

                            <DetailItem
                              icon={<CalendarDays />}
                              label="Valid Until"
                              value={formatDate(certificate.validUntil)}
                            />

                            <DetailItem
                              icon={<UserCheck />}
                              label="Verifying Officer"
                              value={getValue(
                                certificate.officerName,
                                certificate.officerDesignation
                              )}
                            />

                            <DetailItem
                              icon={<MapPin />}
                              label="Location"
                              value={getValue(
                                certificate.location,
                                certificate.district,
                                certificate.state
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        {certificate.pdfUrl && (
                          <button
                            type="button"
                            onClick={downloadCertificate}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#07549a] hover:bg-[#063f73] text-white rounded-md px-5 py-3 font-bold text-sm transition"
                          >
                            <Download className="w-4 h-4" />
                            View Certificate PDF
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={clearVerification}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md px-5 py-3 font-bold text-sm transition"
                        >
                          <Search className="w-4 h-4" />
                          Verify Another
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* INFORMATION */}
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <InfoCard
                  icon={<ShieldCheck />}
                  title="Authentic Verification"
                  text="Certificate details are checked against the official Legal Metrology verification records."
                />

                <InfoCard
                  icon={<QrCode />}
                  title="QR Based Verification"
                  text="Use the QR code printed on the certificate to quickly access the verification record."
                />
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-[#123b6d] text-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    <h3 className="font-bold">
                      How to Verify
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <Step
                    number="1"
                    title="Locate QR Code"
                    text="Open the Legal Metrology certificate and locate the QR code."
                  />

                  <Step
                    number="2"
                    title="Scan or Enter Token"
                    text="Scan the QR code with your device camera or enter the verification token above."
                  />

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={openScanner}
                      className="w-full py-2.5 px-3 bg-[#07549a] hover:bg-[#063f73] text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      Launch QR Scanner
                    </button>
                  </div>

                  <Step
                    number="3"
                    title="Check Details"
                    text="Compare the displayed certificate details with the original certificate."
                  />

                  <Step
                    number="4"
                    title="Confirm Status"
                    text="A verified result confirms that the certificate record exists in the system."
                  />
                </div>
              </div>

            </aside>
          </div>
        </section>
      </main>

      {/* QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#123b6d] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5" />
                <h3 className="font-bold text-base">QR Certificate Scanner</h3>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
                title="Close Scanner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Camera Preview Area */}
              <div className="relative aspect-video sm:aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Visual Viewfinder Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
                    <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400/40 animate-pulse" />
                  </div>
                </div>

                {isStartingCamera && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white gap-2 z-10">
                    <span className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold">Starting camera...</p>
                  </div>
                )}
              </div>

              {/* Error / Alert notice */}
              {scannerError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{scannerError}</p>
                    <p className="text-amber-700 mt-1">
                      You can also take a photo or select an image file with the QR code, or enter the token manually.
                    </p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-xs transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Switch Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-semibold text-xs transition"
                >
                  <Upload className="w-4 h-4" />
                  Scan from Image File
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Instructions:</p>
                <p>• Point your camera directly at the QR code printed on the Legal Metrology Certificate.</p>
                <p>• On modern mobile and desktop browsers, the verification token will be detected automatically and verified immediately.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={closeScanner}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN CANVAS FOR FRAME SAMPLING */}
      <canvas ref={canvasRef} className="hidden" />

      {/* FOOTER */}
      <footer className="bg-[#123b6d] text-white border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-bold text-sm">
                e-Maap Verify
              </p>

              <p className="text-xs text-blue-100 mt-1">
                Department of Consumer Affairs • Government of India
              </p>
            </div>

            <div className="text-xs text-blue-100">
              Legal Metrology Act, 2009
            </div>
          </div>

          <div className="border-t border-white/10 mt-5 pt-4 text-[11px] text-blue-200">
            © Government of India. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

/* =========================================================
   DETAIL ITEM
========================================================= */

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: any;
  valueClass?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon,
  label,
  value,
  valueClass = 'text-slate-800',
}) => {
  const displayValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : (value != null ? String(value) : '—');
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <span className="text-[#123b6d] [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <p className={`text-sm font-semibold break-words ${valueClass}`}>
        {displayValue}
      </p>
    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  text,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#123b6d] flex items-center justify-center mb-3 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>

      <h3 className="font-bold text-[#123b6d] text-sm">
        {title}
      </h3>

      <p className="text-xs text-slate-600 leading-relaxed mt-2">
        {text}
      </p>
    </div>
  );
};

/* =========================================================
   STEP
========================================================= */

interface StepProps {
  number: string;
  title: string;
  text: string;
}

const Step: React.FC<StepProps> = ({
  number,
  title,
  text,
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-[#123b6d] text-white flex items-center justify-center text-xs font-bold shrink-0">
        {number}
      </div>

      <div className="min-w-0">
        <h4 className="text-sm font-bold text-slate-800">
          {title}
        </h4>

        <p className="text-xs text-slate-600 leading-relaxed mt-1">
          {text}
        </p>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;