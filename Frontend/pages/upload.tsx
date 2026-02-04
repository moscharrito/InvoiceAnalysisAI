import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getClaim, uploadClaimInvoice, ClaimResponse } from '../services/api';
import { parseInvoiceData, ParsedInvoiceData } from '../utils/parseInvoice';
import UploadForm from '../components/UploadForm';
import InvoiceCard from '../components/InvoiceCard';
import DecisionTrace from '../components/DecisionTrace';
import { causeOfLossLabels, causeOfLossIcons, formatDate, CauseOfLoss } from '../types/claim';

export default function UploadPage() {
  const router = useRouter();
  const { claimId } = router.query;

  const [claim, setClaim] = useState<ClaimResponse['data'] | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [validationFlags, setValidationFlags] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClaimLoading, setIsClaimLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [isAnimatingCompletion, setIsAnimatingCompletion] = useState(false);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load claim data
  useEffect(() => {
    if (claimId && typeof claimId === 'string') {
      loadClaim(claimId);
    }
  }, [claimId]);

  const loadClaim = async (id: string) => {
    try {
      setIsClaimLoading(true);
      const response = await getClaim(id);
      setClaim(response.data);
    } catch (err) {
      console.error('Failed to load claim:', err);
      setError('Failed to load claim. Please go back and try again.');
    } finally {
      setIsClaimLoading(false);
    }
  };

  // Simulate step progression during analysis
  useEffect(() => {
    if (isLoading || isAnimatingCompletion) {
      stepIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 6000); // Progress every 6 seconds
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

  // Handle completion animation
  useEffect(() => {
    if (pendingResult && !isLoading) {
      setIsAnimatingCompletion(true);
    }
  }, [pendingResult, isLoading]);

  // When all steps are complete, show results
  useEffect(() => {
    if (isAnimatingCompletion && currentStep >= 5 && pendingResult) {
      const finalDelay = setTimeout(() => {
        setCurrentStep(6);
        if (pendingResult.success && pendingResult.data?.analyzeResult?.documents?.[0]?.fields) {
          const fields = pendingResult.data.analyzeResult.documents[0].fields;
          setInvoiceData(fields);
          const parsed = parseInvoiceData(pendingResult.data);
          setParsedData(parsed);

          if (pendingResult.coverage) {
            setCoverageData(pendingResult.coverage);
          }
          if (pendingResult.validationFlags) {
            setValidationFlags(pendingResult.validationFlags);
          }
        }
        setIsAnimatingCompletion(false);
        setPendingResult(null);
      }, 2500);

      return () => clearTimeout(finalDelay);
    }
  }, [isAnimatingCompletion, currentStep, pendingResult]);

  const handleFileUpload = async (file: File) => {
    if (!claim) return;

    try {
      setError('');
      setIsLoading(true);
      setUploadedFileName(file.name);
      setCurrentStep(0);
      setPendingResult(null);
      setIsAnimatingCompletion(false);
      setCoverageData(null);
      setValidationFlags([]);

      const response = await uploadClaimInvoice(claim.id, file);

      if (response.data?.ocrResult?.analyzeResult?.documents?.[0]?.fields) {
        setPendingResult({
          success: true,
          data: response.data.ocrResult,
          coverage: response.data.coverage,
          validationFlags: response.data.validationFlags,
        });
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
      setCoverageData(null);
      setValidationFlags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetUpload = () => {
    setInvoiceData(null);
    setParsedData(null);
    setCoverageData(null);
    setValidationFlags([]);
    setError('');
    setIsLoading(false);
    setCurrentStep(0);
    setUploadedFileName('');
    setPendingResult(null);
    setIsAnimatingCompletion(false);
  };

  // Loading state for claim
  if (isClaimLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="warm-bg" />
        <div className="grid-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-charcoal-600">Loading claim...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no claim
  if (!claim && !isClaimLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="warm-bg" />
        <div className="grid-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-card p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-charcoal-800 mb-2">Claim Not Found</h2>
            <p className="text-charcoal-500 mb-6">{error || 'The claim you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="warm-bg" />
      <div className="grid-overlay" />
      <div className="floating-orb orb-gold w-96 h-96 -top-20 -left-20 animate-float" />
      <div className="floating-orb orb-amber w-80 h-80 top-1/3 -right-10 animate-float animation-delay-2000" />

      {/* Main Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* Header */}
        <header className="text-center pt-4 pb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="glass-card px-6 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-charcoal-700 tracking-wider uppercase">
                Invoice Upload
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-2">
            <span className="text-gradient">Claim</span>
            <span className="text-charcoal-900">Scan</span>
          </h1>
        </header>

        {/* Claim Summary Card */}
        {claim && (
          <div className="max-w-4xl mx-auto w-full mb-8">
            <div className="glass-card p-5 border border-amber-200 bg-amber-50/30">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{causeOfLossIcons[claim.causeOfLoss as CauseOfLoss]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-charcoal-800">Claim #{claim.claimNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {causeOfLossLabels[claim.causeOfLoss as CauseOfLoss]}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-500">{claim.claimantName} • Policy: {claim.policyNumber}</p>
                    <p className="text-xs text-charcoal-400">{claim.propertyAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-charcoal-400">Date of Loss</p>
                  <p className="text-sm font-medium text-charcoal-700">{formatDate(claim.dateOfLoss)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full">

          {/* Upload Section - No results yet */}
          {!invoiceData && !isLoading && !isAnimatingCompletion && !error && (
            <section className="animate-fade-in">
              <div className="max-w-xl mx-auto">
                <div className="glass-frosted p-8 sm:p-10 relative overflow-hidden noise-overlay">
                  <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-400/30 rounded-tl-3xl" />
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-500/30 rounded-br-3xl" />

                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center pulse-ring">
                      <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 text-center mb-2">
                    Upload Contractor Invoice
                  </h2>

                  <p className="text-charcoal-500 text-center mb-8 max-w-md mx-auto text-sm">
                    Upload repair estimates or contractor invoices for this claim
                  </p>

                  <UploadForm onUpload={handleFileUpload} />

                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {['PDF', 'PNG', 'JPG', 'TIFF'].map((format) => (
                      <span key={format} className="glass-badge">{format}</span>
                    ))}
                  </div>
                </div>

                {/* Back Button */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => router.push('/')}
                    className="text-charcoal-500 hover:text-charcoal-700 text-sm font-medium inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Start New Claim
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Loading/Processing State */}
          {(isLoading || isAnimatingCompletion) && (
            <section className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {/* Left Side - Document Preview */}
                <div className="lg:col-span-3">
                  <div className="glass-frosted p-8 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-2xl" />

                    <div className="relative z-10">
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

                      {/* Scanning Animation */}
                      <div className="relative bg-white/50 rounded-2xl p-6 border border-amber-100 mb-6">
                        <div className="space-y-4">
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden w-3/4">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer animation-delay-100" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                          <div className="relative h-4 bg-charcoal-100 rounded overflow-hidden w-5/6">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-shimmer animation-delay-200" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                        </div>

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
                            {currentStep === 0 && 'Classifying document...'}
                            {currentStep === 1 && 'Validating claim association...'}
                            {currentStep === 2 && 'Extracting invoice data...'}
                            {currentStep === 3 && 'Determining coverage...'}
                            {currentStep === 4 && 'Running compliance checks...'}
                            {currentStep >= 5 && 'Generating recommendation...'}
                          </p>
                          <p className="text-xs text-charcoal-400">ClaimScan AI Processing</p>
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

          {/* Error State */}
          {error && !isLoading && (
            <section className="animate-scale-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                <div className="lg:col-span-3">
                  <div className="glass-frosted p-8 border border-red-200 relative overflow-hidden h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start gap-6 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-charcoal-800 mb-2">Analysis Failed</h3>
                          <p className="text-red-600 text-sm mb-4">{error}</p>
                        </div>
                      </div>

                      <button
                        onClick={resetUpload}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>

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
          {invoiceData && (
            <section className="space-y-6 animate-fade-in">
              {/* Success Banner */}
              <div className="glass-card p-4 border border-green-200 max-w-lg mx-auto flex items-center justify-center gap-3 bg-green-50/50">
                <div className="status-dot" />
                <span className="text-green-700 font-medium">Invoice processed - Ready for adjudication</span>
              </div>

              {/* Summary Cards */}
              {parsedData && (
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-2xl font-semibold text-charcoal-800 text-center mb-6">
                    <span className="text-gradient-static">Contractor Invoice</span> Summary
                  </h3>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Contractor', value: parsedData.vendorName, icon: '🔧' },
                      { label: 'Invoice #', value: parsedData.invoiceId, icon: '#️⃣' },
                      { label: 'Invoice Date', value: parsedData.invoiceDate, icon: '📅' },
                      { label: 'Total Amount', value: parsedData.totalAmount, icon: '💰', highlight: true },
                    ].map((item, idx) => (
                      <div
                        key={item.label}
                        className={`glass-card-hover p-5 text-center relative overflow-hidden ${item.highlight ? 'border-amber-300 col-span-2 lg:col-span-1' : ''}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {item.highlight && (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100/50 pointer-events-none" />
                        )}
                        <div className="relative z-10">
                          <div className="text-2xl mb-2">{item.icon}</div>
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

              {/* Coverage Summary */}
              {coverageData && (
                <div className="max-w-4xl mx-auto">
                  <h4 className="text-lg font-semibold text-charcoal-700 mb-4 text-center">Coverage Analysis</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                      { label: 'Covered', value: `$${coverageData.coveredAmount?.toLocaleString() || '0'}`, color: 'text-green-600' },
                      { label: 'Non-Covered', value: `$${coverageData.nonCoveredAmount?.toLocaleString() || '0'}`, color: 'text-red-600' },
                      { label: 'Depreciation', value: `-$${coverageData.depreciation?.toLocaleString() || '0'}`, color: 'text-amber-600' },
                      { label: 'Deductible', value: `-$${coverageData.deductible?.toLocaleString() || '0'}`, color: 'text-blue-600' },
                      { label: 'Recommended Payout', value: `$${coverageData.recommendedPayout?.toLocaleString() || '0'}`, color: 'text-green-700', highlight: true },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`glass-card p-3 text-center ${item.highlight ? 'border-green-300 bg-green-50/50 col-span-2 lg:col-span-1' : ''}`}
                      >
                        <div className={`text-xs uppercase tracking-wider mb-1 ${item.color}`}>{item.label}</div>
                        <div className={`font-semibold ${item.highlight ? 'text-lg' : ''} text-charcoal-800`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Flags */}
              {validationFlags.length > 0 && (
                <div className="max-w-4xl mx-auto">
                  <h4 className="text-lg font-semibold text-charcoal-700 mb-4 text-center">Validation Flags</h4>
                  <div className="space-y-2">
                    {validationFlags.map((flag, index) => (
                      <div
                        key={index}
                        className={`glass-card p-3 flex items-center gap-3 ${
                          flag.severity === 'error' ? 'border-red-200 bg-red-50/50' :
                          flag.severity === 'warning' ? 'border-amber-200 bg-amber-50/50' :
                          'border-blue-200 bg-blue-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          flag.severity === 'error' ? 'bg-red-100' :
                          flag.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          <svg className={`w-4 h-4 ${flag.severity === 'error' ? 'text-red-600' : flag.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${flag.severity === 'error' ? 'text-red-700' : flag.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>{flag.message}</p>
                          <p className="text-xs text-charcoal-500">{flag.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation Badge */}
              <div className="max-w-4xl mx-auto">
                <div className={`glass-card p-4 flex items-center justify-between ${
                  validationFlags.some(f => f.severity === 'error') ? 'border-red-200 bg-red-50/50' :
                  validationFlags.some(f => f.severity === 'warning') ? 'border-amber-200 bg-amber-50/50' :
                  'border-green-200 bg-green-50/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      validationFlags.some(f => f.severity === 'error') ? 'bg-red-100' :
                      validationFlags.some(f => f.severity === 'warning') ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      <svg className={`w-5 h-5 ${validationFlags.some(f => f.severity === 'error') ? 'text-red-600' : validationFlags.some(f => f.severity === 'warning') ? 'text-amber-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${validationFlags.some(f => f.severity === 'error') ? 'text-red-700' : validationFlags.some(f => f.severity === 'warning') ? 'text-amber-700' : 'text-green-700'}`}>
                        {validationFlags.some(f => f.severity === 'error') ? 'Recommended: Manual Review Required' :
                         validationFlags.some(f => f.severity === 'warning') ? 'Recommended: Review Before Approval' :
                         'Recommended: Approve for Payment'}
                      </p>
                      <p className={`text-xs ${validationFlags.some(f => f.severity === 'error') ? 'text-red-600' : validationFlags.some(f => f.severity === 'warning') ? 'text-amber-600' : 'text-green-600'}`}>
                        {validationFlags.some(f => f.severity === 'error') ? `${validationFlags.filter(f => f.severity === 'error').length} error(s) require attention` :
                         validationFlags.some(f => f.severity === 'warning') ? `${validationFlags.filter(f => f.severity === 'warning').length} warning(s) flagged` :
                         'All validation checks passed'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    validationFlags.some(f => f.severity === 'error') ? 'bg-red-100 text-red-700 border-red-200' :
                    validationFlags.some(f => f.severity === 'warning') ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {validationFlags.some(f => f.severity === 'error') ? 'Manual Review' :
                     validationFlags.some(f => f.severity === 'warning') ? 'Review Required' : 'Auto-Approve'}
                  </span>
                </div>
              </div>

              {/* Invoice Details */}
              {invoiceData && (
                <div className="max-w-5xl mx-auto">
                  <InvoiceCard data={invoiceData} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="max-w-4xl mx-auto flex justify-center gap-4 pt-6">
                <button
                  onClick={resetUpload}
                  className="px-6 py-2.5 glass-button"
                >
                  Upload Another Invoice
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50 transition-all text-sm font-medium"
                >
                  New Claim
                </button>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-16 pb-8">
          <div className="glass-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-charcoal-600 text-sm font-medium">ClaimScan</span>
            </div>
            <p className="text-charcoal-400 text-xs">
              &copy; {new Date().getFullYear()} Property Insurance Claims Processing
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
