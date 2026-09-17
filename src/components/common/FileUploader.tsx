import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  error?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  description = 'PDF, PNG or JPG up to 10MB',
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 10,
  onFileSelect,
  selectedFile,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (file: File) => {
    setLocalError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File exceeds maximum size of ${maxSizeMb}MB`);
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayError = error || localError;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition ${
          isDragging
            ? 'border-teal-600 bg-teal-50/50'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/30'
            : displayError
            ? 'border-rose-300 bg-rose-50/30'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 text-center">
              Click to browse <span className="font-normal text-slate-500">or drag and drop</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 text-center">{description}</p>
          </>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
