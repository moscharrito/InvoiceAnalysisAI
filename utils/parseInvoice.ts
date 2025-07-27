export interface ParsedInvoiceData {
  vendorName: string;
  invoiceId: string;
  invoiceDate: string;
  totalAmount: string;
  lineItems: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
}

export function parseInvoiceData(azureResult: any): ParsedInvoiceData {
  const fields = azureResult?.analyzeResult?.documents?.[0]?.fields || {};
  
  return {
    vendorName: fields.VendorName?.content || 'Unknown',
    invoiceId: fields.InvoiceId?.content || 'N/A',
    invoiceDate: fields.InvoiceDate?.content || 'N/A',
    totalAmount: fields.InvoiceTotal?.content || '0.00',
    lineItems: fields.Items?.valueArray?.map((item: any) => ({
      description: item.valueObject?.Description?.content || 'N/A',
      quantity: item.valueObject?.Quantity?.content || '0',
      unitPrice: item.valueObject?.UnitPrice?.content || '0.00',
      amount: item.valueObject?.Amount?.content || '0.00',
    })) || []
  };
}

export function formatCurrency(amount: string): string {
  const num = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? amount : `$${num.toFixed(2)}`;
}

export function validateInvoiceData(data: ParsedInvoiceData): boolean {
  return !!(data.vendorName && data.invoiceId && data.totalAmount);
}