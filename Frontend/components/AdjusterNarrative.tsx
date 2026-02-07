import React from 'react';

interface AdjusterNarrativeProps {
  narrative: string;
  confidenceScore: number;
  recommendedAction: string;
}

export default function AdjusterNarrative({ narrative, confidenceScore, recommendedAction }: AdjusterNarrativeProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceBarColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-amber-400 to-amber-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className="glass-frosted p-6 relative overflow-hidden noise-overlay">
      {/* Decorative Corner */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-amber-400/30 rounded-tl-3xl" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-charcoal-800">AI Claims Adjuster</h3>
          <p className="text-charcoal-400 text-xs">Professional Assessment Summary</p>
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-white/60 rounded-xl p-4 mb-5 border border-charcoal-100">
        <p className="text-charcoal-700 text-sm leading-relaxed">{narrative}</p>
      </div>

      {/* Confidence Score */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-charcoal-500">Analysis Confidence</span>
        <span className={`text-sm font-bold ${getConfidenceColor(confidenceScore)}`}>
          {confidenceScore}%
        </span>
      </div>
      <div className="h-2.5 bg-charcoal-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getConfidenceBarColor(confidenceScore)} transition-all duration-1000 ease-out`}
          style={{ width: `${confidenceScore}%` }}
        />
      </div>
    </div>
  );
}
