import React, { useState, useEffect, useRef } from 'react';
import { analyzeInvoice } from '../services/api';
import { parseInvoiceData, ParsedInvoiceData } from '../utils/parseInvoice';
import UploadForm from '../components/UploadForm';
import InvoiceCard from '../components/InvoiceCard';
import DecisionTrace from '../components/DecisionTrace';
import ProjectSelector from '../components/ProjectSelector';
import { Project, projectTypeLabels, projectTypeColors } from '../types/project';

export default function Home() {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [isAnimatingCompletion, setIsAnimatingCompletion] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate step progression during analysis
  useEffect(() => {
    if (isLoading || isAnimatingCompletion) {
      stepIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 60000); // Progress every 60 seconds for extended visibility
    } else {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    }

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [isLoading, isAnimatingCompletion]);

  // Handle completion animation - show remaining steps before displaying results
  useEffect(() => {
    if (pendingResult && !isLoading) {
      setIsAnimatingCompletion(true);
    }
  }, [pendingResult, isLoading]);

  // When all steps are complete and we have pending result, show the results
  useEffect(() => {
    if (isAnimatingCompletion && currentStep >= 5 && pendingResult) {
      // Wait a moment on the final step before showing results
      const finalDelay = setTimeout(() => {
        setCurrentStep(6);
        if (pendingResult.success && pendingResult.data?.analyzeResult?.documents?.[0]?.fields) {
          const fields = pendingResult.data.analyzeResult.documents[0].fields;
          setInvoiceData(fields);
          const parsed = parseInvoiceData(pendingResult.data);
          setParsedData(parsed);
        }
        setIsAnimatingCompletion(false);
        setPendingResult(null);
      }, 2500); // Show final step for 2.5 seconds

      return () => clearTimeout(finalDelay);
    }
  }, [isAnimatingCompletion, currentStep, pendingResult]);

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      setIsLoading(true);
      setUploadedFileName(file.name);
      setCurrentStep(0);
      setPendingResult(null);
      setIsAnimatingCompletion(false);

      const result = await analyzeInvoice(file);

      if (result?.analyzeResult?.documents?.[0]?.fields) {
        // Store result and let animation complete
        setPendingResult({ success: true, data: result });
      } else {
        throw new Error('No invoice data found in the document');
      }
    } catch (err) {
      console.error('Invoice processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process invoice');
      setInvoiceData(null);
      setParsedData(null);
      setPendingResult(null);
      setIsAnimatingCompletion(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setInvoiceData(null);
    setParsedData(null);
    setError('');
    setIsLoading(false);
    setCurrentStep(0);
    setUploadedFileName('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Warm Background */}
      <div className="warm-bg" />

      {/* Grid Overlay */}
      <div className="grid-overlay" />

      {/* Floating Gradient Orbs */}
      <div className="floating-orb orb-gold w-96 h-96 -top-20 -left-20 animate-float" />
      <div className="floating-orb orb-amber w-80 h-80 top-1/3 -right-10 animate-float animation-delay-2000" />
      <div className="floating-orb orb-cream w-72 h-72 bottom-20 left-1/4 animate-float animation-delay-4000" />
      <div className="floating-orb orb-warm w-64 h-64 top-2/3 right-1/3 animate-float animation-delay-1000" />

      {/* Main Content Container */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* Header Section */}
        <header className="text-center pt-8 pb-12 animate-slide-down">
          {/* Floating Logo Badge */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="glass-card px-6 py-3 flex items-center gap-3 border-gradient-animated">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
              <span className="text-sm font-medium text-charcoal-700 tracking-wider uppercase">
                AI-Powered Analysis
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Invoice</span>
            <br />
            <span className="text-charcoal-900">Intelligence</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-charcoal-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Transform your invoices into structured data with the power of
            <span className="text-gradient-static font-semibold"> Azure AI</span>
          </p>

          {/* Action Button when results exist */}
          {(invoiceData || parsedData) && (
            <button
              onClick={resetApp}
              className="glass-button group inline-flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Analysis
              </span>
            </button>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full">

          {/* Upload Section - Initial State */}
          {!invoiceData && !parsedData && !isLoading && !error && (
            <section className="animate-fade-in">
              <div className="max-w-xl mx-auto">
                {/* Glass Upload Card */}
                <div className="glass-frosted p-8 sm:p-12 relative overflow-hidden noise-overlay">
                  {/* Decorative Corner Elements */}
                  <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-400/30 rounded-tl-3xl" />
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-500/30 rounded-br-3xl" />

                  {/* Icon */}
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center pulse-ring">
                      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 text-center mb-3">
                    Upload Your Invoice
                  </h2>

                  {/* Description */}
                  <p className="text-charcoal-500 text-center mb-8 max-w-md mx-auto">
                    Drop your invoice file below and watch AI extract every detail in seconds
                  </p>

                  {/* Upload Form */}
                  <UploadForm onUpload={handleFileUpload} />

                  {/* Supported Formats */}
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {['PDF', 'PNG', 'JPG', 'TIFF'].map((format) => (
                      <span
                        key={format}
                        className="glass-badge"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {/* Fast */}
                  <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-charcoal-800 font-medium text-sm">Fast</div>
                    <div className="text-charcoal-400 text-xs">Instant extraction</div>
                  </div>

                  {/* Accurate */}
                  <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-charcoal-800 font-medium text-sm">Accurate</div>
                    <div className="text-charcoal-400 text-xs">AI-powered OCR</div>
                  </div>

                  {/* Secure */}
                  <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-charcoal-800 font-medium text-sm">Secure</div>
                    <div className="text-charcoal-400 text-xs">Data protected</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Loading State - Side by Side Layout */}
          {(isLoading || isAnimatingCompletion) && (
            <section className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {/* Left Side - Document Preview & Status */}
                <div className="lg:col-span-3">
                  <div className="glass-frosted p-8 h-full relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-2xl" />

                    <div className="relative z-10">
                      {/* Document Icon & File Info */}
                      <div className="flex items-start gap-6 mb-8">
                        <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-charcoal-800 mb-1">
                            {isAnimatingCompletion ? 'Finalizing Analysis' : 'Analyzing Document'}
                          </h3>
                          <p className="text-charcoal-500 text-sm mb-3 truncate">
                            {uploadedFileName || 'invoice.pdf'}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isAnimatingCompletion ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className={`text-xs font-medium ${isAnimatingCompletion ? 'text-green-600' : 'text-amber-600'}`}>
                              {isAnimatingCompletion ? 'Data received, completing steps...' : 'Processing in progress...'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Animated Document Visualization */}
                      <div className="relative bg-white/50 rounded-2xl p-6 border border-amber-100 mb-6">
                        <div className="space-y-4">
                          {/* Scanning Animation Lines */}
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden w-3/4">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer animation-delay-100" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden w-5/6">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer animation-delay-200" style={{ backgroundSize: '200% 100%' }} />
                          </div>

                          <div className="pt-4 border-t border-charcoal-100">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="h-3 bg-charcoal-100 rounded w-20 animate-pulse" />
                                <div className="h-5 bg-charcoal-100 rounded w-32 animate-pulse animation-delay-100" />
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 bg-charcoal-100 rounded w-16 animate-pulse animation-delay-200" />
                                <div className="h-5 bg-charcoal-100 rounded w-24 animate-pulse animation-delay-300" />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-charcoal-100">
                            <div className="h-3 bg-charcoal-100 rounded w-24 mb-3 animate-pulse" />
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <div className="h-4 bg-charcoal-100 rounded w-40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                  <div className="h-4 bg-charcoal-100 rounded w-20 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-scan" />
                        </div>
                      </div>

                      {/* Current Action */}
                      <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-charcoal-800">
                            {currentStep === 0 && 'Uploading document...'}
                            {currentStep === 1 && 'Pre-processing image...'}
                            {currentStep === 2 && 'Running OCR extraction...'}
                            {currentStep === 3 && 'Analyzing invoice fields...'}
                            {currentStep === 4 && 'Validating extracted data...'}
                            {currentStep >= 5 && 'Generating results...'}
                          </p>
                          <p className="text-xs text-charcoal-400">
                            Azure AI Document Intelligence
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Decision Trace */}
                <div className="lg:col-span-2">
                  <DecisionTrace
                    currentStep={currentStep}
                    isComplete={currentStep >= 5 && isAnimatingCompletion}
                    isError={false}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Error State - Side by Side Layout */}
          {error && (
            <section className="animate-scale-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {/* Left Side - Error Message */}
                <div className="lg:col-span-3">
                  <div className="glass-frosted p-8 border border-red-200 relative overflow-hidden h-full">
                    {/* Error Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                      {/* Error Icon */}
                      <div className="flex items-start gap-6 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-charcoal-800 mb-2">
                            Analysis Failed
                          </h3>
                          <p className="text-red-600 text-sm mb-4">
                            {error}
                          </p>
                          {uploadedFileName && (
                            <p className="text-charcoal-400 text-xs">
                              File: {uploadedFileName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-white/50 rounded-xl p-4 mb-6 border border-charcoal-100">
                        <h4 className="text-sm font-medium text-charcoal-700 mb-3">Suggestions:</h4>
                        <ul className="space-y-2 text-sm text-charcoal-600">
                          <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ensure the document is a valid invoice format
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Check that text is clearly visible and not blurry
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Try a different file format (PDF recommended)
                          </li>
                        </ul>
                      </div>

                      {/* Retry Button */}
                      <button
                        onClick={resetApp}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Again
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Decision Trace showing error */}
                <div className="lg:col-span-2">
                  <DecisionTrace
                    currentStep={currentStep}
                    isComplete={false}
                    isError={true}
                    errorMessage={error}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Results Section */}
          {(invoiceData || parsedData) && (
            <section className="space-y-8 animate-fade-in">
              {/* Success Banner */}
              <div className="glass-card p-4 border border-green-200 max-w-lg mx-auto flex items-center justify-center gap-3 bg-green-50/50">
                <div className="status-dot" />
                <span className="text-green-700 font-medium">Invoice analyzed successfully</span>
              </div>

              {/* Summary Cards */}
              {parsedData && (
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-2xl font-semibold text-charcoal-800 text-center mb-8">
                    <span className="text-gradient-static">Invoice</span> Summary
                  </h3>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Vendor', value: parsedData.vendorName, icon: '🏢' },
                      { label: 'Invoice ID', value: parsedData.invoiceId, icon: '#️⃣' },
                      { label: 'Date', value: parsedData.invoiceDate, icon: '📅' },
                      { label: 'Total', value: parsedData.totalAmount, icon: '💰', highlight: true },
                    ].map((item, idx) => (
                      <div
                        key={item.label}
                        className={`glass-card-hover p-6 text-center relative overflow-hidden ${item.highlight ? 'border-amber-300 col-span-2 lg:col-span-1' : ''}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {item.highlight && (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100/50 pointer-events-none" />
                        )}
                        <div className="relative z-10">
                          <div className="text-2xl mb-3">{item.icon}</div>
                          <div className="text-charcoal-400 text-xs uppercase tracking-wider mb-1">{item.label}</div>
                          <div className={`font-semibold truncate ${item.highlight ? 'text-xl text-gradient-static' : 'text-charcoal-800'}`}>
                            {item.value || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Invoice Data */}
              {invoiceData && (
                <div className="max-w-5xl mx-auto">
                  <InvoiceCard data={invoiceData} />
                </div>
              )}
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-16 pb-8">
          <div className="glass-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
              <span className="text-charcoal-600 text-sm font-medium">Invoice Intelligence</span>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-700" />
            </div>
            <p className="text-charcoal-400 text-xs">
              &copy; {new Date().getFullYear()} Powered by Azure AI Document Intelligence
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
