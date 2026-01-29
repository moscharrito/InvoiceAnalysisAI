import React, { useState, useRef, useCallback } from "react";

interface UploadFormProps {
  onUpload: (file: File) => Promise<void>;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate progress for visual feedback
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onUpload(file);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
      if (allowedTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5v-6H8.5c.83 0 1.5.67 1.5 1.5v1zm5 3.5h-2.5v-6H15c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2zm4-6v1.5h-2v1h2v1.5h-2v2h-1.5v-6H20zM7 13.5h1v-1H7v1zm5 0h1c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5h-1v-3z"/>
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    );
  };

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/tiff"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop Zone */}
      {!file ? (
        <div
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            drop-zone cursor-pointer p-8 transition-all duration-300 relative
            ${isDragging ? 'dragover scale-[1.02]' : 'hover:border-purple-500/30'}
          `}
        >
          {/* Animated Border on Drag */}
          {isDragging && (
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-500 animate-pulse pointer-events-none" />
          )}

          {/* Upload Icon */}
          <div className="flex flex-col items-center">
            <div className={`
              w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-all duration-300
              ${isDragging
                ? 'bg-purple-500/30 scale-110'
                : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
              }
            `}>
              <svg
                className={`w-8 h-8 transition-all duration-300 ${isDragging ? 'text-purple-300 -translate-y-1' : 'text-purple-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Drop your file here' : 'Drag & drop your invoice'}
              </p>
              <p className="text-white/40 text-sm">
                or <span className="text-purple-400 hover:text-purple-300 transition-colors">browse files</span>
              </p>
            </div>

            {/* Size Limit */}
            <p className="text-white/30 text-xs mt-4">
              Maximum file size: 20 MB
            </p>
          </div>
        </div>
      ) : (
        /* File Preview Card */
        <div className="glass-card p-6 animate-scale-in">
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              {getFileIcon(file.type)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate mb-1">
                {file.name}
              </p>
              <p className="text-white/40 text-sm">
                {formatFileSize(file.size)}
              </p>

              {/* Progress Bar (when processing) */}
              {isProcessing && (
                <div className="mt-3">
                  <div className="glass-progress">
                    <div
                      className="glass-progress-bar transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white/50 text-xs mt-1">
                    {uploadProgress < 100 ? 'Processing...' : 'Complete!'}
                  </p>
                </div>
              )}
            </div>

            {/* Remove Button */}
            {!isProcessing && (
              <button
                onClick={removeFile}
                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          {!isProcessing && (
            <div className="flex gap-3 mt-6">
              {/* Change File Button */}
              <button
                onClick={triggerFileInput}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium"
              >
                Change File
              </button>

              {/* Analyze Button */}
              <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="flex-1 glass-button group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 transition-transform group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Analyze
                </span>
              </button>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mt-4 flex items-center justify-center gap-3 text-white/60 text-sm">
              <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <span>Analyzing with Azure AI...</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      {!file && (
        <div className="mt-6 flex items-start gap-3 text-white/40 text-xs">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            For best results, ensure your invoice is clear and all text is readable.
            Scanned documents should have a minimum resolution of 300 DPI.
          </p>
        </div>
      )}
    </div>
  );
}
