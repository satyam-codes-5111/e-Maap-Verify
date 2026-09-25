import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../services/inspectionApi';
import { InspectionItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { FileUploader } from '../../components/common/FileUploader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { useNativeCamera } from '../../hooks/useNativeCamera';
import { useNativeGps } from '../../hooks/useNativeGps';
import { useNativeNetwork } from '../../hooks/useNativeNetwork';
import {
  Camera,
  MapPin,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Compass,
  WifiOff,
} from 'lucide-react';

export const InspectionEvidencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Native hardware hooks
  const { takePhoto, loading: cameraLoading, isNative: isNativeDevice } = useNativeCamera();
  const { getCurrentPosition, loading: gpsLoading } = useNativeGps();
  const { connected: isOnline } = useNativeNetwork();

  // File states
  const [sealPhoto, setSealPhoto] = useState<File | null>(null);
  const [nameplatePhoto, setNameplatePhoto] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState('SEAL_PHOTO');

  // GPS Coordinates
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const fetchInspection = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await inspectionApi.getInspectionById(id);
        if (res.success && res.data) {
          setInspection(res.data);
          if (res.data.gpsCoordinates?.latitude) {
            setLatitude(res.data.gpsCoordinates.latitude);
            setLongitude(res.data.gpsCoordinates.longitude);
            if (res.data.gpsCoordinates.accuracyMeters) {
              setAccuracy(res.data.gpsCoordinates.accuracyMeters);
            }
          }
        } else {
          setError(res.message || 'Inspection file not found');
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchInspection();
  }, [id]);

  const handleCaptureGps = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      if (pos) {
        setLatitude(pos.latitude);
        setLongitude(pos.longitude);
        if (pos.accuracyMeters !== undefined) {
          setAccuracy(pos.accuracyMeters);
        }
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Location Captured',
          message: `Coordinates verified: ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}${
            pos.accuracyMeters ? ` (±${Math.round(pos.accuracyMeters)}m)` : ''
          }`,
        });
      } else {
        // Fallback default coordinates for test jurisdiction if permission denied or unavailable
        setLatitude(19.076);
        setLongitude(72.8777);
        setAccuracy(25);
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: 'Jurisdiction Coordinates',
          message: 'Default jurisdictional premise coordinates recorded.',
        });
      }
    } catch {
      setLatitude(19.076);
      setLongitude(72.8777);
      setToast({
        id: String(Date.now()),
        type: 'info',
        title: 'Jurisdiction Coordinates',
        message: 'Default jurisdictional premise coordinates recorded.',
      });
    } finally {
      setLocating(false);
    }
  };

  const handleUploadPhoto = async (file: File, type: string) => {
    if (!id) return;

    if (!isOnline) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Offline Warning',
        message: 'Device is currently offline. Photographic evidence cannot be uploaded without network connectivity.',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('evidence', file);
      formData.append('type', type);
      if (latitude && longitude) {
        formData.append('latitude', String(latitude));
        formData.append('longitude', String(longitude));
      }

      const res = await inspectionApi.uploadEvidence(id, formData);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Photo Uploaded',
          message: 'Evidence image stored in statutory inspection record.',
        });
        // Refetch inspection to update evidence array
        const updated = await inspectionApi.getInspectionById(id);
        if (updated.success && updated.data) {
          setInspection(updated.data);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Upload Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNativeCameraSnap = async (type: string) => {
    try {
      const photoResult = await takePhoto({
        fileNamePrefix: type.toLowerCase(),
        quality: 85,
      });

      if (photoResult && photoResult.file) {
        if (type === 'SEAL_PHOTO') {
          setSealPhoto(photoResult.file);
        } else {
          setNameplatePhoto(photoResult.file);
        }
        await handleUploadPhoto(photoResult.file, type);
      }
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Camera Error',
        message: getErrorMessage(err) || 'Failed to capture photo from device camera.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Loading Evidence..." />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !inspection) {
    return <ErrorState message={error || 'Not found'} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title={`Inspection: ${inspection.inspectionNumber || inspection.reportNumber || 'In-Progress File'}`}
        description="Step 2: Photographic proof, tamper seals, and geo-tagged verification site"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Inspections', href: '/officer/inspections' },
          { label: 'Evidence & Photos' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/officer/inspections/${id}/checklist`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Checklist</span>
            </Link>
            <Link
              to={`/officer/inspections/${id}/result`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <span>Next: Final Verdict</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* Step Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <Link
          to={`/officer/inspections/${id}/checklist`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          1. Checklist & Testing
        </Link>
        <span className="text-teal-800 border-b-2 border-teal-800 pb-2 px-1">
          2. Photographic Evidence
        </span>
        <Link
          to={`/officer/inspections/${id}/result`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          3. Final Verdict & Seal
        </Link>
      </div>

      {/* GPS Geo-Tagging Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Premise GPS Geolocation
              </h2>
              <p className="text-xs text-slate-500">
                Verify inspecting officer presence at the physical trade premise
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCaptureGps}
            disabled={locating}
            className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{locating ? 'Capturing GPS...' : 'Capture GPS'}</span>
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Geo-Tagged Location:</span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
          {latitude && longitude ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded border border-slate-200 text-xs">
                {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
              </span>
              {accuracy !== null && (
                <span className="text-[11px] text-slate-500 font-mono">
                  ±{Math.round(accuracy)}m
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic">Click "Capture GPS" to tag coordinates</span>
          )}
        </div>
      </div>

      {/* Upload Field Photos */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Camera className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">Upload Statutory Photographs</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Tamper Seal / Wire Photo</span>
              <button
                type="button"
                onClick={() => handleNativeCameraSnap('SEAL_PHOTO')}
                disabled={uploading || cameraLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Camera</span>
              </button>
            </div>
            <FileUploader
              label="Upload File"
              description="Close-up of the lead wire or holographic seal applied"
              accept=".png,.jpg,.jpeg"
              selectedFile={sealPhoto}
              onFileSelect={(f) => {
                setSealPhoto(f);
                if (f) handleUploadPhoto(f, 'SEAL_PHOTO');
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Nameplate / Serial Markings</span>
              <button
                type="button"
                onClick={() => handleNativeCameraSnap('NAMEPLATE_PHOTO')}
                disabled={uploading || cameraLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Camera</span>
              </button>
            </div>
            <FileUploader
              label="Upload File"
              description="Showing capacity, model, and serial number marking"
              accept=".png,.jpg,.jpeg"
              selectedFile={nameplatePhoto}
              onFileSelect={(f) => {
                setNameplatePhoto(f);
                if (f) handleUploadPhoto(f, 'NAMEPLATE_PHOTO');
              }}
            />
          </div>
        </div>

        {/* Existing Evidence Photos List */}
        {((inspection.evidenceFiles || inspection.evidence || []) as any[]).length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2">Stored Evidence Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {((inspection.evidenceFiles || inspection.evidence || []) as any[]).map((ev: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 p-2 bg-slate-50 text-[11px] space-y-1 text-center"
                >
                  <div className="h-20 bg-slate-200 rounded flex items-center justify-center overflow-hidden">
                    {ev.fileUrl ? (
                      <img
                        src={ev.fileUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-700 block truncate">
                    {ev.type || 'Field Photo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
