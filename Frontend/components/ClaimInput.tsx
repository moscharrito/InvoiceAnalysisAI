import React, { useState } from 'react';
import { ClaimInput as ClaimInputType, CauseOfLoss, causeOfLossLabels, causeOfLossIcons } from '../types/claim';

interface ClaimInputProps {
  onSubmit: (claim: Omit<ClaimInputType, 'claimNumber'>) => void;
  isLoading?: boolean;
}

export default function ClaimInput({ onSubmit, isLoading = false }: ClaimInputProps) {
  const [formData, setFormData] = useState<Omit<ClaimInputType, 'claimNumber'>>({
    policyNumber: '',
    claimantName: '',
    propertyAddress: '',
    dateOfLoss: '',
    causeOfLoss: 'water',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Omit<ClaimInputType, 'claimNumber'>, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<ClaimInputType, 'claimNumber'>, string>> = {};

    if (!formData.policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required';
    }

    if (!formData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant name is required';
    }

    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }

    if (!formData.dateOfLoss) {
      newErrors.dateOfLoss = 'Date of loss is required';
    } else {
      const lossDate = new Date(formData.dateOfLoss);
      const today = new Date();
      if (lossDate > today) {
        newErrors.dateOfLoss = 'Date of loss cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof Omit<ClaimInputType, 'claimNumber'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const causeOfLossOptions: CauseOfLoss[] = [
    'water', 'fire', 'wind', 'hail', 'theft', 'vandalism', 'lightning', 'collapse', 'other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner - Claim number auto-generated */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-amber-700">
          A unique claim number will be <strong>automatically generated</strong> when you submit.
        </p>
      </div>

      {/* Policy Number */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
          Policy Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <input
            type="text"
            value={formData.policyNumber}
            onChange={(e) => handleChange('policyNumber', e.target.value.toUpperCase())}
            placeholder="HO-12345678"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
              errors.policyNumber ? 'border-red-300 bg-red-50' : 'border-charcoal-200'
            } focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all`}
            disabled={isLoading}
          />
        </div>
        {errors.policyNumber && (
          <p className="mt-1 text-xs text-red-500">{errors.policyNumber}</p>
        )}
      </div>

      {/* Claimant Name */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
          Claimant Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            value={formData.claimantName}
            onChange={(e) => handleChange('claimantName', e.target.value)}
            placeholder="John Smith"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
              errors.claimantName ? 'border-red-300 bg-red-50' : 'border-charcoal-200'
            } focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all`}
            disabled={isLoading}
          />
        </div>
        {errors.claimantName && (
          <p className="mt-1 text-xs text-red-500">{errors.claimantName}</p>
        )}
      </div>

      {/* Property Address */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
          Property Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={formData.propertyAddress}
            onChange={(e) => handleChange('propertyAddress', e.target.value)}
            placeholder="123 Main Street, City, State 12345"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
              errors.propertyAddress ? 'border-red-300 bg-red-50' : 'border-charcoal-200'
            } focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all`}
            disabled={isLoading}
          />
        </div>
        {errors.propertyAddress && (
          <p className="mt-1 text-xs text-red-500">{errors.propertyAddress}</p>
        )}
      </div>

      {/* Date of Loss & Cause - Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date of Loss */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Date of Loss <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="date"
              value={formData.dateOfLoss}
              onChange={(e) => handleChange('dateOfLoss', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                errors.dateOfLoss ? 'border-red-300 bg-red-50' : 'border-charcoal-200'
              } focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all`}
              disabled={isLoading}
            />
          </div>
          {errors.dateOfLoss && (
            <p className="mt-1 text-xs text-red-500">{errors.dateOfLoss}</p>
          )}
        </div>

        {/* Cause of Loss Dropdown */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Cause of Loss <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-sm">{causeOfLossIcons[formData.causeOfLoss]}</span>
            </div>
            <select
              value={formData.causeOfLoss}
              onChange={(e) => handleChange('causeOfLoss', e.target.value as CauseOfLoss)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-charcoal-200 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all appearance-none bg-white"
              disabled={isLoading}
            >
              {causeOfLossOptions.map((cause) => (
                <option key={cause} value={cause}>
                  {causeOfLossLabels[cause]}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-3 px-6 rounded-xl font-medium text-white transition-all
          ${isLoading
            ? 'bg-charcoal-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating Claim...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Create Claim & Continue
          </span>
        )}
      </button>
    </form>
  );
}
