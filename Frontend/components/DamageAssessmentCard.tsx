import React from 'react';
import { DamageAssessment, severityLevelConfig } from '../types/claim';

interface DamageAssessmentCardProps {
  assessment: DamageAssessment;
}

export default function DamageAssessmentCard({ assessment }: DamageAssessmentCardProps) {
  const severityConfig = severityLevelConfig[assessment.severityLevel];

  return (
    <div className="glass-frosted p-6 relative overflow-hidden noise-overlay">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-charcoal-800">Damage Assessment</h3>
            <p className="text-charcoal-400 text-xs">AI Visual Analysis</p>
          </div>
        </div>

        {/* Severity Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityConfig.color}`}>
          {severityConfig.label}
        </span>
      </div>

      {/* Cause Consistency */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border mb-4 ${
        assessment.consistentWithCause
          ? 'bg-green-50/50 border-green-200'
          : 'bg-red-50/50 border-red-200'
      }`}>
        {assessment.consistentWithCause ? (
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        <div>
          <p className={`text-sm font-medium ${assessment.consistentWithCause ? 'text-green-700' : 'text-red-700'}`}>
            {assessment.consistentWithCause ? 'Consistent with Stated Cause' : 'Inconsistency Detected'}
          </p>
          <p className="text-xs text-charcoal-500 mt-0.5">{assessment.consistencyNotes}</p>
        </div>
      </div>

      {/* Observed Damage Types */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-charcoal-500 mb-2">Observed Damage Types</h4>
        <div className="flex flex-wrap gap-2">
          {assessment.observedDamageTypes.map((type, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-charcoal-100 text-charcoal-700 text-xs">
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Additional Observations */}
      {assessment.additionalObservations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-charcoal-500 mb-2">Additional Observations</h4>
          <ul className="space-y-1.5">
            {assessment.additionalObservations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-charcoal-600">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
