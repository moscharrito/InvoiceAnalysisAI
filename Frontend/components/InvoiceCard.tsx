import React, { useState } from 'react';

interface InvoiceData {
  VendorName?: { content: string };
  InvoiceId?: { content: string };
  InvoiceDate?: { content: string };
  InvoiceTotal?: { content: string };
  Items?: { valueArray: Array<{ valueObject: any }> };
}

interface InvoiceCardProps {
  data: InvoiceData;
}

export default function InvoiceCard({ data }: InvoiceCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${data.InvoiceId?.content || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineItems = data.Items?.valueArray || [];
  const hasLineItems = lineItems.length > 0;

  return (
    <div className="glass-frosted p-6 sm:p-8 relative overflow-hidden noise-overlay">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Detailed Analysis</h2>
              <p className="text-white/40 text-sm">Complete invoice breakdown</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className={`
              px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300
              ${copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'glass-card hover:bg-white/10 text-white/80 hover:text-white'
              }
            `}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          <button
            onClick={downloadJSON}
            className="glass-button px-4 py-2.5 text-sm"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </span>
          </button>
        </div>
      </div>

      {/* Tab Navigation (for line items view) */}
      {hasLineItems && (
        <div className="relative z-10 flex gap-1 p-1 glass-card rounded-xl w-fit mb-6">
          {[
            { id: 'table', label: 'Table View', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )},
            { id: 'json', label: 'JSON', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            )},
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'table' | 'json')}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-300
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white'
                  : 'text-white/50 hover:text-white/80'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Line Items Section */}
      {hasLineItems && activeTab === 'table' && (
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Line Items</h3>
            <span className="glass-badge text-xs">
              {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Glass Table */}
          <div className="glass-table overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">#</th>
                    <th className="text-left">Description</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td>
                        <span className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-medium">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="font-medium text-white/90 group-hover:text-white transition-colors">
                        {item.valueObject?.Description?.content || 'N/A'}
                      </td>
                      <td className="text-right tabular-nums">
                        {item.valueObject?.Quantity?.content || '-'}
                      </td>
                      <td className="text-right tabular-nums">
                        {item.valueObject?.UnitPrice?.content || '-'}
                      </td>
                      <td className="text-right tabular-nums font-medium text-purple-300">
                        {item.valueObject?.Amount?.content || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Total */}
            <div className="border-t border-white/10 p-4 flex justify-between items-center bg-purple-500/5">
              <span className="text-white/50 text-sm">Invoice Total</span>
              <span className="text-xl font-semibold text-gradient-static">
                {data.InvoiceTotal?.content || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* JSON View */}
      {hasLineItems && activeTab === 'json' && (
        <div className="relative z-10 mb-6">
          <div className="glass-card p-4 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <span className="text-white/50 text-sm">Raw JSON Data</span>
              <button
                onClick={copyToClipboard}
                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            <pre className="text-xs sm:text-sm text-white/70 overflow-x-auto custom-scrollbar font-mono max-h-80">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* No Line Items Message */}
      {!hasLineItems && (
        <div className="relative z-10 text-center py-8 glass-card rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">No line items found in this invoice</p>
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="text-white/50">AI Confidence</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[92%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
            </div>
            <span className="text-green-400 font-medium">High</span>
          </div>
        </div>
      </div>

      {/* Processing Info */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-4 text-xs text-white/30">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Processed just now
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          Document Intelligence
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Secure processing
        </div>
      </div>
    </div>
  );
}
