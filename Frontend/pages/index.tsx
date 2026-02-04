import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClaim } from '../services/api';
import ClaimInput from '../components/ClaimInput';
import { ClaimInput as ClaimInputType } from '../types/claim';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle claim submission - save to database and redirect to upload page
  const handleClaimSubmit = async (claim: Omit<ClaimInputType, 'claimNumber'>) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await createClaim(claim);

      // Redirect to upload page with claim ID
      router.push(`/upload?claimId=${response.data.id}`);
    } catch (err: any) {
      console.error('Create claim error:', err);
      // Better error message handling
      let errorMessage = 'Failed to create claim. ';
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setIsLoading(false);
    }
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
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-charcoal-700 tracking-wider uppercase">
                Property Insurance Claims
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Claim</span>
            <span className="text-charcoal-900">Scan</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-charcoal-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Streamline property claim adjudication with
            <span className="text-gradient-static font-semibold"> AI-powered invoice processing</span>
          </p>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          <section className="animate-fade-in">
            <div className="max-w-xl mx-auto">
              {/* Glass Claim Card */}
              <div className="glass-frosted p-8 sm:p-10 relative overflow-hidden noise-overlay">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-400/30 rounded-tl-3xl" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-500/30 rounded-br-3xl" />

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center pulse-ring">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 text-center mb-2">
                  Start New Claim
                </h2>

                {/* Description */}
                <p className="text-charcoal-500 text-center mb-8 max-w-md mx-auto text-sm">
                  Enter claim details to begin processing contractor invoices
                </p>

                {/* Claim Input Form */}
                <ClaimInput onSubmit={handleClaimSubmit} isLoading={isLoading} />

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-charcoal-800 font-medium text-sm">Track Claims</div>
                  <div className="text-charcoal-400 text-xs">Organized workflow</div>
                </div>

                <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-charcoal-800 font-medium text-sm">Validate Coverage</div>
                  <div className="text-charcoal-400 text-xs">Auto-adjudication</div>
                </div>

                <div className="glass-card-hover p-4 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="text-charcoal-800 font-medium text-sm">Fraud Detection</div>
                  <div className="text-charcoal-400 text-xs">Built-in checks</div>
                </div>
              </div>

              {/* Process Steps */}
              <div className="mt-12">
                <h3 className="text-center text-charcoal-600 text-sm font-medium mb-6">How It Works</h3>
                <div className="flex items-center justify-between max-w-md mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                    <span className="text-xs text-charcoal-500 mt-2">Enter Claim</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-charcoal-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-charcoal-200 text-charcoal-500 flex items-center justify-center font-bold text-sm">2</div>
                    <span className="text-xs text-charcoal-500 mt-2">Upload Invoice</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-charcoal-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-charcoal-200 text-charcoal-500 flex items-center justify-center font-bold text-sm">3</div>
                    <span className="text-xs text-charcoal-500 mt-2">Model Analysis</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-charcoal-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-charcoal-200 text-charcoal-500 flex items-center justify-center font-bold text-sm">4</div>
                    <span className="text-xs text-charcoal-500 mt-2">Review</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
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
              &copy; {new Date().getFullYear()} Property Insurance Claims Processing • Powered by AI
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
