import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface InvoiceAnalysisResponse {
  success: boolean;
  data: any;
  fileName: string;
  fileSize: number;
  error?: string;
}

export const analyzeInvoice = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<InvoiceAnalysisResponse>('/invoice/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to analyze invoice');
  }

  return response.data.data;
};

export const checkApiStatus = async (): Promise<{ status: string; azureConfigured: boolean }> => {
  const response = await apiClient.get('/invoice/status');
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
