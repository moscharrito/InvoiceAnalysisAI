import axios from 'axios';
import { ClaimInput, CauseOfLoss } from '../types/claim';

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

export interface ClaimResponse {
  success: boolean;
  data: {
    id: string;
    claimNumber: string;
    policyNumber: string;
    claimantName: string;
    propertyAddress: string;
    dateOfLoss: string;
    causeOfLoss: CauseOfLoss;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ClaimInvoiceResponse {
  success: boolean;
  data: {
    invoice: any;
    ocrResult: any;
    validationFlags: Array<{
      code: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
    coverage: {
      coveredAmount: number;
      nonCoveredAmount: number;
      depreciation: number;
      deductible: number;
      recommendedPayout: number;
    };
  };
  fileName: string;
  fileSize: number;
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

// Claims API

export const generateClaimNumber = async (): Promise<string> => {
  const response = await apiClient.get<{ success: boolean; claimNumber: string }>('/claims/generate-number');
  return response.data.claimNumber;
};

export const createClaim = async (claim: Omit<ClaimInput, 'claimNumber'>): Promise<ClaimResponse> => {
  const response = await apiClient.post<ClaimResponse>('/claims', claim);

  if (!response.data.success) {
    throw new Error('Failed to create claim');
  }

  return response.data;
};

export const getClaim = async (claimId: string): Promise<ClaimResponse> => {
  const response = await apiClient.get<ClaimResponse>(`/claims/${claimId}`);
  return response.data;
};

export const uploadClaimInvoice = async (claimId: string, file: File): Promise<ClaimInvoiceResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ClaimInvoiceResponse>(`/claims/${claimId}/invoices`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error('Failed to process invoice');
  }

  return response.data;
};

export const getClaimInvoices = async (claimId: string): Promise<{ success: boolean; data: any[] }> => {
  const response = await apiClient.get(`/claims/${claimId}/invoices`);
  return response.data;
};

export default apiClient;
