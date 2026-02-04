import React, { useEffect, useState } from 'react';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: string;
  details?: string[];
}

interface DecisionTraceProps {
  currentStep: number;
  isComplete: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const PROCESS_STEPS: Omit<ProcessStep, 'status'>[] = [
  {
    id: 'upload',
    title: 'Document Classification',
    description: 'Validating and classifying document',
    details: ['File type validation', 'Document type detection', 'Claim association verified'],
  },
  {
    id: 'preprocess',
    title: 'Claim Validation',
    description: 'Verifying claim information',
    details: ['Policy status check', 'Coverage period validation', 'Deductible verification'],
  },
  {
    id: 'ocr',
    title: 'Invoice Extraction',
    description: 'Extracting contractor invoice data',
    details: ['Vendor information', 'Line item detection', 'Amount extraction'],
  },
  {
    id: 'analysis',
    title: 'Coverage Determination',
    description: 'Analyzing coverage applicability',
    details: ['Covered vs non-covered items', 'Depreciation calculation', 'Deductible application'],
  },
  {
    id: 'validation',
    title: 'Fraud & Compliance',
    description: 'Running validation checks',
    details: ['Duplicate invoice check', 'Amount threshold validation', 'Date consistency check'],
  },
  {
    id: 'output',
    title: 'Adjudication Recommendation',
    description: 'Generating claim recommendation',
    details: ['Coverage summary', 'Payment calculation', 'Action recommendation'],
  },
];

export default function DecisionTrace({ currentStep, isComplete, isError, errorMessage }: DecisionTraceProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Calculate overall progress
  const totalSteps = PROCESS_STEPS.length;
  const targetProgress = isComplete ? 100 : isError ? (currentStep / totalSteps) * 100 : ((currentStep + 0.5) / totalSteps) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.5) return targetProgress;
        return prev + diff * 0.1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [targetProgress]);

  const getStepStatus = (index: number): ProcessStep['status'] => {
    if (isError && index === currentStep) return 'error';
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'processing';
    return 'pending';
  };

  const getStepIcon = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return <div className="w-2 h-2 rounded-full bg-current" />;
    }
  };

  const getStepColors = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          border: 'border-green-200',
          line: 'bg-green-400',
        };
      case 'processing':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-600',
          border: 'border-amber-300',
          line: 'bg-amber-400',
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          border: 'border-red-200',
          line: 'bg-red-400',
        };
      default:
        return {
          bg: 'bg-charcoal-100',
          text: 'text-charcoal-400',
          border: 'border-charcoal-200',
          line: 'bg-charcoal-200',
        };
    }
  };

  return (
    <div className="glass-frosted p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-charcoal-800">Claim Processing</h3>
          <p className="text-charcoal-400 text-xs">AI Adjudication Pipeline</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-charcoal-500">Overall Progress</span>
          <span className="text-xs font-semibold text-amber-600">{Math.round(animatedProgress)}%</span>
        </div>
        <div className="h-2 bg-charcoal-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{
              width: `${animatedProgress}%`,
              background: isError
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : isComplete
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #f59e0b, #d97706)',
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {PROCESS_STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const colors = getStepColors(status);
          const isExpanded = expandedStep === step.id;
          const isClickable = status !== 'pending';

          return (
            <div key={step.id} className="relative">
              {/* Connecting Line */}
              {index < PROCESS_STEPS.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-6 transition-colors duration-300 ${
                    index < currentStep ? 'bg-green-400' : 'bg-charcoal-200'
                  }`}
                />
              )}

              {/* Step Card */}
              <div
                onClick={() => isClickable && setExpandedStep(isExpanded ? null : step.id)}
                className={`
                  relative p-3 rounded-xl border transition-all duration-300
                  ${colors.border} ${isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                  ${status === 'processing' ? 'bg-amber-50/50 shadow-sm' : 'bg-white/50'}
                  ${isExpanded ? 'shadow-md' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Step Icon */}
                  <div
                    className={`
                      w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${colors.bg} ${colors.text} transition-all duration-300
                      ${status === 'processing' ? 'animate-pulse' : ''}
                    `}
                  >
                    {getStepIcon(status)}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium text-sm ${status === 'pending' ? 'text-charcoal-400' : 'text-charcoal-800'}`}>
                        {step.title}
                      </h4>
                      {status === 'completed' && (
                        <span className="text-xs text-green-600 font-medium">Done</span>
                      )}
                      {status === 'processing' && (
                        <span className="text-xs text-amber-600 font-medium animate-pulse">Processing...</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${status === 'pending' ? 'text-charcoal-300' : 'text-charcoal-500'}`}>
                      {step.description}
                    </p>

                    {/* Expanded Details */}
                    {isExpanded && step.details && (
                      <div className="mt-3 pt-3 border-t border-charcoal-100">
                        <div className="space-y-1.5">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                              <span className="text-charcoal-600">{detail}</span>
                              {status === 'completed' && (
                                <svg className="w-3 h-3 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {status === 'error' && errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-600">{errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Expand Indicator */}
                  {isClickable && step.details && (
                    <svg
                      className={`w-4 h-4 text-charcoal-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Status */}
      <div className="mt-4 pt-4 border-t border-charcoal-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-600">Analysis Complete</span>
              </>
            ) : isError ? (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-red-600">Analysis Failed</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-600">Processing</span>
              </>
            )}
          </div>
          <span className="text-xs text-charcoal-400">
            Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}
