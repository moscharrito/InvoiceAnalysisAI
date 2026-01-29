import axios from 'axios';

interface AnalyzeResult {
  status: string;
  analyzeResult?: {
    documents?: Array<{
      fields?: Record<string, any>;
    }>;
  };
}

export const analyzeInvoice = async (fileBuffer: Buffer, mimeType: string): Promise<AnalyzeResult> => {
  const endpoint = process.env.AZURE_ENDPOINT;
  const key = process.env.AZURE_KEY;

  if (!endpoint || !key) {
    throw new Error('Azure credentials not configured. Please set AZURE_ENDPOINT and AZURE_KEY environment variables.');
  }

  // Send document to Azure Form Recognizer
  const response = await axios.post(
    `${endpoint}/formrecognizer/documentModels/prebuilt-invoice:analyze?api-version=2023-07-31`,
    fileBuffer,
    {
      headers: {
        'Content-Type': mimeType,
        'Ocp-Apim-Subscription-Key': key,
      },
    }
  );

  const resultUrl = response.headers['operation-location'];

  if (!resultUrl) {
    throw new Error('Failed to get operation location from Azure response');
  }

  let result: AnalyzeResult | null = null;
  let attempts = 0;
  const maxAttempts = 30; // Max 60 seconds (30 * 2s)

  // Poll until result is ready
  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 2000));

    const poll = await axios.get(resultUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
      },
    });

    result = poll.data;

    if (result && result.status !== 'running' && result.status !== 'notStarted') {
      break;
    }

    attempts++;
  }

  if (!result) {
    throw new Error('Azure analysis timed out');
  }

  if (result.status === 'failed') {
    throw new Error('Azure analysis failed');
  }

  return result;
};
