import React from 'react';

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
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 p-6 bg-white/90 rounded-xl shadow-gold border border-gold-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gold-700 font-elegant">Invoice Analysis Results</h2>
        <div className="space-x-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gold-500 text-white rounded hover:bg-gold-600 transition"
          >
            Copy JSON
          </button>
          <button
            onClick={downloadJSON}
            className="px-4 py-2 bg-charcoal-800 text-white rounded hover:bg-charcoal-900 transition"
          >
            Download JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 border text-center shadow">
          <h3 className="font-serif text-sm text-gray-500">Vendor Name</h3>
          <p className="text-lg text-gray-800 font-semibold">{data.VendorName?.content || 'Not found'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center shadow">
          <h3 className="font-serif text-sm text-gray-500">Invoice ID</h3>
          <p className="text-lg text-gray-800 font-semibold">{data.InvoiceId?.content || 'Not found'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center shadow">
          <h3 className="font-serif text-sm text-gray-500">Invoice Date</h3>
          <p className="text-lg text-gray-800 font-semibold">{data.InvoiceDate?.content || 'Not found'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center shadow">
          <h3 className="font-serif text-sm text-gray-500">Total Amount</h3>
          <p className="text-lg font-bold text-gold-700">{data.InvoiceTotal?.content || 'Not found'}</p>
        </div>
      </div>

      {data.Items?.valueArray && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-center text-gold-700 mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gold-200 text-sm">
              <thead className="bg-gold-100 text-gold-800">
                <tr>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Quantity</th>
                  <th className="px-4 py-2 border">Unit Price</th>
                  <th className="px-4 py-2 border">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.Items.valueArray.map((item, idx) => (
                  <tr key={idx} className="bg-white text-center">
                    <td className="px-4 py-2 border">{item.valueObject?.Description?.content || 'N/A'}</td>
                    <td className="px-4 py-2 border">{item.valueObject?.Quantity?.content || 'N/A'}</td>
                    <td className="px-4 py-2 border">{item.valueObject?.UnitPrice?.content || 'N/A'}</td>
                    <td className="px-4 py-2 border">{item.valueObject?.Amount?.content || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
