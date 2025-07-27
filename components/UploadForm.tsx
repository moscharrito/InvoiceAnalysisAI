import React, { useState } from "react";

interface UploadFormProps {
  onUpload: (file: File) => Promise<void>;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!file) return setStatus("Please select a file.");
    setStatus("Processing invoice with Azure AI...");
    setIsProcessing(true);
    try {
      await onUpload(file);
      setStatus("Invoice processed successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setStatus("");
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 border border-gold-100 rounded-xl shadow-gold p-6 text-center">
      <h2 className="text-2xl font-semibold text-gold-700 font-elegant mb-4">Upload Invoice</h2>
      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold-100 file:text-gold-800 hover:file:bg-gold-200"
        />
        {file && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isProcessing}
        className="w-full flex gap-2 items-center justify-center px-6 py-2 bg-gold-500 text-white font-medium rounded hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Analyze Invoice
          </>
        )}
      </button>

      {status && (
        <p className={`mt-4 text-sm ${status.includes("failed") ? "text-red-600" : "text-green-700"}`}>
          {status}
        </p>
      )}
    </div>
  );
}
