import React, { useState } from 'react';
import { LineItemAssessment as LineItemAssessmentType, formatCurrency, repairCategoryLabels, RepairCategory } from '../types/claim';

interface LineItemAssessmentProps {
  items: LineItemAssessmentType[];
}

export default function LineItemAssessment({ items }: LineItemAssessmentProps) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const getStatusColor = (item: LineItemAssessmentType) => {
    if (!item.isCovered) return 'bg-red-50 border-red-200';
    const diff = Math.abs(item.invoicedAmount - item.assessedAmount);
    const pctDiff = item.invoicedAmount > 0 ? diff / item.invoicedAmount : 0;
    if (pctDiff < 0.05) return 'bg-green-50 border-green-200';
    if (pctDiff < 0.2) return 'bg-amber-50 border-amber-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getStatusBadge = (item: LineItemAssessmentType) => {
    if (!item.isCovered) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Not Covered</span>;
    }
    const diff = Math.abs(item.invoicedAmount - item.assessedAmount);
    const pctDiff = item.invoicedAmount > 0 ? diff / item.invoicedAmount : 0;
    if (pctDiff < 0.05) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Reasonable</span>;
    }
    if (pctDiff < 0.2) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Adjusted</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Flagged</span>;
  };

  const getCategoryLabel = (category: string): string => {
    return repairCategoryLabels[category as RepairCategory] || category;
  };

  const totalInvoiced = items.reduce((sum, item) => sum + item.invoicedAmount, 0);
  const totalAssessed = items.reduce((sum, item) => sum + item.assessedAmount, 0);
  const totalAdjustment = totalInvoiced - totalAssessed;

  return (
    <div className="glass-frosted p-6 relative overflow-hidden noise-overlay">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-charcoal-800">Line Item Assessment</h3>
          <p className="text-charcoal-400 text-xs">{items.length} items evaluated</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-charcoal-50 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-charcoal-400">Total Invoiced</p>
          <p className="text-sm font-bold text-charcoal-800">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-charcoal-400">Total Assessed</p>
          <p className="text-sm font-bold text-charcoal-800">{formatCurrency(totalAssessed)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-charcoal-400">Adjustment</p>
          <p className={`text-sm font-bold ${totalAdjustment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {totalAdjustment > 0 ? '-' : ''}{formatCurrency(Math.abs(totalAdjustment))}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm ${getStatusColor(item)}`}
            onClick={() => setExpandedItem(expandedItem === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-charcoal-800 truncate">{item.description}</h4>
                  {getStatusBadge(item)}
                </div>
                <span className="text-xs text-charcoal-400">{getCategoryLabel(item.category)}</span>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-charcoal-400">Invoiced</p>
                    <p className="text-sm font-medium text-charcoal-700">{formatCurrency(item.invoicedAmount)}</p>
                  </div>
                  <svg className="w-4 h-4 text-charcoal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div>
                    <p className="text-xs text-charcoal-400">Assessed</p>
                    <p className={`text-sm font-bold ${item.isCovered ? 'text-charcoal-800' : 'text-red-600'}`}>
                      {formatCurrency(item.assessedAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Reasoning */}
            {expandedItem === index && (
              <div className="mt-3 pt-3 border-t border-charcoal-200/50">
                <p className="text-xs text-charcoal-600">
                  <span className="font-medium">Reasoning:</span> {item.reasoning}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
