// Azure OCR Logic

import axios from 'axios';

export const analyzeInvoice = async (file: File): Promise<any> => {
  const endpoint = process.env.NEXT_PUBLIC_AZURE_ENDPOINT;
  const key = process.env.NEXT_PUBLIC_AZURE_KEY;

  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${endpoint}/formrecognizer/documentModels/prebuilt-invoice:analyze?api-version=2023-07-31`,
    file,
    {
      headers: {
        'Content-Type': file.type,
        'Ocp-Apim-Subscription-Key': key,
      },
    }
  );

  const resultUrl = response.headers['operation-location'];
  let result = null;

  // Poll until result is ready
  while (!result || result.status === 'running' || result.status === 'notStarted') {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await axios.get(resultUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
      },
    });
    result = poll.data;
  }

  return result;
};