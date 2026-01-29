import React, { useState } from 'react';
import { analyzeInvoice } from '../services/api';
import { parseInvoiceData, ParsedInvoiceData } from '../utils/parseInvoice';
import UploadForm from '../components/UploadForm';
import InvoiceCard from '../components/InvoiceCard';

export default function Home() {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      setIsLoading(true);
      const result = await analyzeInvoice(file);
      if (result?.analyzeResult?.documents?.[0]?.fields) {
        const fields = result.analyzeResult.documents[0].fields;
        setInvoiceData(fields);
        const parsed = parseInvoiceData(result);
        setParsedData(parsed);
      } else {
        throw new Error('No invoice data found in the document');
      }
    } catch (err) {
      console.error('Invoice processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process invoice');
      setInvoiceData(null);
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setInvoiceData(null);
    setParsedData(null);
    setError('');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[url('/cut-paper-background.png')] bg-cover bg-fixed bg-no-repeat text-center text-gray-800">
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <header className="w-full bg-yellow-500 text-white rounded-xl shadow-lg py-8 px-4 mb-12">
          <h1 className="text-5xl font-bold tracking-wide mb-2">Invoice Intelligence</h1>
          <p className="text-lg tracking-wide font-light">Powered by Azure AI</p>
          {(invoiceData || parsedData) && (
            <button
              onClick={resetApp}
              className="mt-6 px-6 py-2 bg-yellow-600 text-white rounded-full shadow-md hover:bg-yellow-700 transition-all"
            >
              + New Analysis
            </button>
          )}
        </header>

        <main className="w-full space-y-10">
          {!invoiceData && !parsedData && !isLoading && !error && (
            <section className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
              <p className="text-lg text-gray-600 mb-6">Upload an invoice to extract and summarize key data</p>
              <UploadForm onUpload={handleFileUpload} />
            </section>
          )}

          {isLoading && (
            <section className="py-20 flex flex-col items-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-yellow-500 border-t-transparent mb-6"></div>
              <h3 className="text-2xl font-semibold text-yellow-700">Processing Invoice...</h3>
              <p className="text-gray-600 mt-2">Analyzing your document. Please wait.</p>
            </section>
          )}

          {error && (
            <section className="max-w-md mx-auto bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Oops! Something went wrong.</h3>
              <p className="mb-4">{error}</p>
              <button
                onClick={resetApp}
                className="px-6 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition"
              >
                Try Again
              </button>
            </section>
          )}

          {(invoiceData || parsedData) && (
            <section className="w-full space-y-10">
              <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md py-3 px-6 text-center font-medium shadow">
                Invoice processed successfully!
              </div>

              {parsedData && (
                <section className="max-w-xl mx-auto">
                  <h3 className="text-2xl font-semibold text-yellow-700 mb-6">Invoice Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Vendor', value: parsedData.vendorName },
                      { label: 'Invoice ID', value: parsedData.invoiceId },
                      { label: 'Date', value: parsedData.invoiceDate },
                      { label: 'Total', value: parsedData.totalAmount, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div
                        key={label}
                        className={`bg-white border border-yellow-200 rounded-xl p-4 shadow-sm text-center ${
                          highlight ? 'text-yellow-700 font-semibold text-lg' : ''
                        }`}
                      >
                        <div className="text-sm text-gray-500">{label}</div>
                        <div className="mt-1">{value || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {invoiceData && (
                <section className="max-w-xl mx-auto">
                  <h3 className="text-2xl font-semibold text-yellow-700 mb-4">Detailed Invoice Data</h3>
                  <div className="bg-white border border-yellow-100 rounded-xl shadow p-4">
                    <InvoiceCard data={invoiceData} />
                  </div>
                </section>
              )}
            </section>
          )}
        </main>

        <footer className="w-full mt-24 text-center text-sm text-yellow-900 bg-yellow-100 py-6 rounded-t-xl">
          <p>&copy; {new Date().getFullYear()} Invoice Intelligence — AI Form Recognition</p>
        </footer>
      </div>
    </div>
  );
}
