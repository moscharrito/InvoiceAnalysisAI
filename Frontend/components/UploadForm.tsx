import React, { useState, useRef, useCallback } from "react";

interface UploadFormProps {
  onUpload: (invoices: File[], evidence: File[]) => Promise<void>;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const [isDraggingEvidence, setIsDraggingEvidence] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const invoiceTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
  const evidenceTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const handleUpload = async () => {
    if (invoiceFiles.length === 0 && evidenceFiles.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { clearInterval(progressInterval); return prev; }
        return prev + 5;
      });
    }, 500);

    try {
      await onUpload(invoiceFiles, evidenceFiles);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const addFiles = (newFiles: FileList | File[], target: 'invoices' | 'evidence') => {
    const allowed = target === 'invoices' ? invoiceTypes : evidenceTypes;
    const valid = Array.from(newFiles).filter(f => allowed.includes(f.type));
    if (target === 'invoices') {
      setInvoiceFiles(prev => [...prev, ...valid].slice(0, 5));
    } else {
      setEvidenceFiles(prev => [...prev, ...valid].slice(0, 10));
    }
  };

  const removeFile = (target: 'invoices' | 'evidence', index: number) => {
    if (target === 'invoices') {
      setInvoiceFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, target: 'invoices' | 'evidence') => {
    e.preventDefault();
    target === 'invoices' ? setIsDraggingInvoice(false) : setIsDraggingEvidence(false);
    addFiles(e.dataTransfer.files, target);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const totalFiles = invoiceFiles.length + evidenceFiles.length;

  return (
    <div className="w-full space-y-5">
      {/* Invoice Drop Zone */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-2">
          Contractor Invoices
          <span className="text-charcoal-400 font-normal ml-1">(PDF, JPEG, PNG)</span>
        </label>
        <input
          ref={invoiceInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/tiff"
          multiple
          onChange={(e) => { if (e.target.files) addFiles(e.target.files, 'invoices'); }}
          className="hidden"
        />

        <div
          onClick={() => invoiceInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingInvoice(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingInvoice(false); }}
          onDrop={(e) => handleDrop(e, 'invoices')}
          className={`drop-zone cursor-pointer p-5 transition-all duration-300 ${isDraggingInvoice ? 'dragover scale-[1.01]' : 'hover:border-amber-400'}`}
        >
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all ${isDraggingInvoice ? 'bg-amber-200 scale-110' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-charcoal-700 font-medium text-sm mb-0.5">
              {isDraggingInvoice ? 'Drop invoices here' : 'Drag & drop invoices'}
            </p>
            <p className="text-charcoal-400 text-xs">
              or <span className="text-amber-600 font-medium">browse files</span> (max 5)
            </p>
          </div>
        </div>

        {/* Invoice File List */}
        {invoiceFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {invoiceFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/60 border border-charcoal-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-charcoal-700 truncate">{file.name}</p>
                  <p className="text-xs text-charcoal-400">{formatFileSize(file.size)}</p>
                </div>
                {!isProcessing && (
                  <button onClick={(e) => { e.stopPropagation(); removeFile('invoices', i); }} className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Drop Zone */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-2">
          Damage Evidence Photos
          <span className="text-charcoal-400 font-normal ml-1">(JPEG, PNG, WebP)</span>
        </label>
        <input
          ref={evidenceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => { if (e.target.files) addFiles(e.target.files, 'evidence'); }}
          className="hidden"
        />

        <div
          onClick={() => evidenceInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingEvidence(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingEvidence(false); }}
          onDrop={(e) => handleDrop(e, 'evidence')}
          className={`drop-zone cursor-pointer p-5 transition-all duration-300 ${isDraggingEvidence ? 'dragover scale-[1.01]' : 'hover:border-blue-400'}`}
        >
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all ${isDraggingEvidence ? 'bg-blue-200 scale-110' : 'bg-gradient-to-br from-blue-100 to-blue-200'}`}>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-charcoal-700 font-medium text-sm mb-0.5">
              {isDraggingEvidence ? 'Drop photos here' : 'Drag & drop damage photos'}
            </p>
            <p className="text-charcoal-400 text-xs">
              or <span className="text-blue-600 font-medium">browse photos</span> (max 10)
            </p>
          </div>
        </div>

        {/* Evidence File List */}
        {evidenceFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {evidenceFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 border border-charcoal-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                </div>
                <p className="text-xs text-charcoal-700 truncate flex-1">{file.name}</p>
                {!isProcessing && (
                  <button onClick={(e) => { e.stopPropagation(); removeFile('evidence', i); }} className="w-5 h-5 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="glass-card p-4">
          <div className="glass-progress mb-2">
            <div className="glass-progress-bar transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div className="flex items-center justify-center gap-3 text-charcoal-500 text-sm">
            <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            <span>Analyzing with AI Claims Adjuster...</span>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {totalFiles > 0 && !isProcessing && (
        <button
          onClick={handleUpload}
          disabled={isProcessing || invoiceFiles.length === 0}
          className="w-full glass-button group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Analyze Claim ({invoiceFiles.length} invoice{invoiceFiles.length !== 1 ? 's' : ''}{evidenceFiles.length > 0 ? `, ${evidenceFiles.length} photo${evidenceFiles.length !== 1 ? 's' : ''}` : ''})
          </span>
        </button>
      )}

      {/* Tip */}
      {totalFiles === 0 && (
        <div className="flex items-start gap-3 text-charcoal-400 text-xs">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            Upload contractor invoices for OCR extraction and damage photos for visual assessment.
            The AI adjuster will analyze all documents together.
          </p>
        </div>
      )}
    </div>
  );
}
