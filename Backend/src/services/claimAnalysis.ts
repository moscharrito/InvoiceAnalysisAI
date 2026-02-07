import { AzureOpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

// LLM Analysis Result types
export interface LLMClaimAnalysis {
  coverageAnalysis: {
    coveredAmount: number;
    nonCoveredAmount: number;
    depreciation: number;
    deductible: number;
    netPayable: number;
    coverageNotes: string[];
  };
  lineItemAssessments: Array<{
    description: string;
    invoicedAmount: number;
    assessedAmount: number;
    category: string;
    isCovered: boolean;
    reasoning: string;
  }>;
  validationFlags: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    field?: string;
  }>;
  damageAssessment: {
    observedDamageTypes: string[];
    severityLevel: 'minor' | 'moderate' | 'severe' | 'catastrophic';
    consistentWithCause: boolean;
    consistencyNotes: string;
    additionalObservations: string[];
  };
  recommendedAction: string;
  depreciationAnalysis: {
    rate: number;
    method: string;
    reasoning: string;
  };
  adjusterNarrative: string;
  confidenceScore: number;
}

interface ClaimContext {
  claimNumber: string;
  policyNumber: string;
  claimantName: string;
  propertyAddress: string;
  dateOfLoss: string;
  causeOfLoss: string;
}

interface InvoiceData {
  vendorName?: string;
  vendorAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  lineItems?: Array<{ description?: string; amount?: number; quantity?: number; unitPrice?: number }>;
}

interface EvidenceImage {
  base64: string;
  mimeType: string;
  fileName: string;
}

// Initialize Azure OpenAI client
function getClient(): AzureOpenAI {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY.');
  }

  return new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
  });
}

const SYSTEM_PROMPT = `You are a senior property insurance claims adjuster with 20 years of experience. Your role is to analyze claim documentation (contractor invoices and damage evidence photos) and produce a professional claims assessment.

You must apply industry-standard practices including:
- Xactimate-comparable pricing validation for repair items
- Cause-of-loss consistency analysis (does the damage match the stated cause?)
- ACV (Actual Cash Value) depreciation methodology
- Standard deductible application
- Identification of potentially non-covered items
- Detection of pricing anomalies or inflated costs

IMPORTANT: You must return ONLY valid JSON matching the exact schema provided. No markdown, no explanations outside the JSON.`;

function buildUserPrompt(
  claim: ClaimContext,
  invoices: InvoiceData[],
  hasImages: boolean
): string {
  const claimSection = `
## CLAIM INFORMATION
- Claim Number: ${claim.claimNumber}
- Policy Number: ${claim.policyNumber}
- Claimant: ${claim.claimantName}
- Property Address: ${claim.propertyAddress}
- Date of Loss: ${claim.dateOfLoss}
- Cause of Loss: ${claim.causeOfLoss}
`;

  const invoiceSection = invoices.map((inv, i) => {
    const items = inv.lineItems?.map((item, j) =>
      `  ${j + 1}. ${item.description || 'Unknown item'} - Qty: ${item.quantity || 1}, Unit: $${item.unitPrice || 0}, Total: $${item.amount || 0}`
    ).join('\n') || '  No line items extracted';

    return `
### Invoice ${i + 1}
- Vendor: ${inv.vendorName || 'Unknown'}
- Address: ${inv.vendorAddress || 'N/A'}
- Invoice #: ${inv.invoiceNumber || 'N/A'}
- Invoice Date: ${inv.invoiceDate || 'N/A'}
- Total Amount: $${inv.totalAmount || 0}
- Line Items:
${items}`;
  }).join('\n');

  const imageInstruction = hasImages
    ? '\n## DAMAGE EVIDENCE\nAnalyze the attached damage evidence photos. Assess the visible damage type, severity, and whether it is consistent with the stated cause of loss.\n'
    : '\n## DAMAGE EVIDENCE\nNo damage photos provided. Base your damage assessment solely on the invoice line items and stated cause of loss. Note the lack of photographic evidence in your assessment.\n';

  const outputSchema = `
## REQUIRED JSON OUTPUT
Return ONLY a JSON object with this exact structure:
{
  "coverageAnalysis": {
    "coveredAmount": <number - total covered repair costs>,
    "nonCoveredAmount": <number - non-covered items total>,
    "depreciation": <number - depreciation deduction>,
    "deductible": <number - policy deductible amount, typically $1000-2500>,
    "netPayable": <number - final recommended payout>,
    "coverageNotes": [<string array - brief coverage notes>]
  },
  "lineItemAssessments": [
    {
      "description": "<item description>",
      "invoicedAmount": <number>,
      "assessedAmount": <number - your assessed fair value>,
      "category": "<one of: roofing, siding, windows, doors, flooring, drywall, painting, electrical, plumbing, hvac, structural, debris_removal, temporary_repairs, general_labor, materials, other>",
      "isCovered": <boolean>,
      "reasoning": "<brief explanation>"
    }
  ],
  "validationFlags": [
    {
      "code": "<flag code>",
      "severity": "<info|warning|error>",
      "message": "<description>",
      "field": "<optional field name>"
    }
  ],
  "damageAssessment": {
    "observedDamageTypes": [<string array>],
    "severityLevel": "<minor|moderate|severe|catastrophic>",
    "consistentWithCause": <boolean>,
    "consistencyNotes": "<explanation>",
    "additionalObservations": [<string array>]
  },
  "recommendedAction": "<auto_approve|approve_with_adjustment|manual_review|request_documentation|escalate|deny>",
  "depreciationAnalysis": {
    "rate": <number 0-1>,
    "method": "<depreciation method used>",
    "reasoning": "<explanation>"
  },
  "adjusterNarrative": "<2-4 sentence professional narrative summarizing the claim assessment>",
  "confidenceScore": <number 0-100>
}`;

  return `${claimSection}\n## CONTRACTOR INVOICES\n${invoiceSection}\n${imageInstruction}\n${outputSchema}`;
}

// Main analysis function
export async function analyzeClaimWithLLM(
  claim: ClaimContext,
  invoices: InvoiceData[],
  evidenceImages: EvidenceImage[]
): Promise<LLMClaimAnalysis> {
  const client = getClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

  // Build content blocks
  const contentParts: ChatCompletionContentPart[] = [];

  // Text prompt
  contentParts.push({
    type: 'text',
    text: buildUserPrompt(claim, invoices, evidenceImages.length > 0),
  });

  // Add damage evidence images
  for (const img of evidenceImages) {
    const mediaType = img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${mediaType};base64,${img.base64}`,
        detail: 'high',
      },
    });
  }

  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contentParts },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Azure OpenAI');
    }

    // Parse JSON response - handle potential markdown wrapping
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const analysis: LLMClaimAnalysis = JSON.parse(jsonStr);

    // Validate required fields
    if (!analysis.coverageAnalysis || !analysis.recommendedAction || !analysis.adjusterNarrative) {
      throw new Error('LLM response missing required fields');
    }

    return analysis;
  } catch (error) {
    console.error('LLM analysis error:', error);

    // If JSON parsing failed, retry with stricter prompt
    if (error instanceof SyntaxError) {
      console.log('Retrying LLM analysis with stricter prompt...');
      try {
        const retryResponse = await client.chat.completions.create({
          model: deployment,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + '\n\nCRITICAL: Return ONLY the JSON object. No text before or after. No markdown code blocks.' },
            { role: 'user', content: contentParts },
          ],
          max_tokens: 4096,
          temperature: 0.1,
        });

        const retryContent = retryResponse.choices[0]?.message?.content?.trim();
        if (retryContent) {
          let cleanJson = retryContent;
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          return JSON.parse(cleanJson);
        }
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
    }

    // Fallback: generate a basic analysis from available data
    return generateFallbackAnalysis(invoices);
  }
}

// Fallback analysis when LLM is unavailable
function generateFallbackAnalysis(invoices: InvoiceData[]): LLMClaimAnalysis {
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const coveredAmount = totalAmount * 0.85;
  const depreciation = coveredAmount * 0.1;
  const deductible = 1000;
  const netPayable = Math.max(0, coveredAmount - depreciation - deductible);

  const lineItemAssessments = invoices.flatMap(inv =>
    (inv.lineItems || []).map(item => ({
      description: item.description || 'Unknown item',
      invoicedAmount: item.amount || 0,
      assessedAmount: item.amount || 0,
      category: 'other' as string,
      isCovered: true,
      reasoning: 'Assessed using simplified rules (AI analysis unavailable)',
    }))
  );

  return {
    coverageAnalysis: {
      coveredAmount,
      nonCoveredAmount: totalAmount - coveredAmount,
      depreciation,
      deductible,
      netPayable,
      coverageNotes: ['AI analysis unavailable - using simplified 85% coverage estimate'],
    },
    lineItemAssessments,
    validationFlags: [{
      code: 'LLM_UNAVAILABLE',
      severity: 'warning',
      message: 'AI claims adjuster analysis was unavailable. Using simplified assessment rules.',
    }],
    damageAssessment: {
      observedDamageTypes: ['Unable to assess - AI unavailable'],
      severityLevel: 'moderate',
      consistentWithCause: true,
      consistencyNotes: 'Unable to verify cause-of-loss consistency without AI analysis',
      additionalObservations: [],
    },
    recommendedAction: 'manual_review',
    depreciationAnalysis: {
      rate: 0.1,
      method: 'flat-rate',
      reasoning: 'Default 10% depreciation applied (AI analysis unavailable)',
    },
    adjusterNarrative: `This claim requires manual review. The automated AI analysis was unavailable, and a simplified assessment has been generated using default coverage rules. Total invoiced amount: $${totalAmount.toLocaleString()}. Estimated net payable: $${netPayable.toLocaleString()}.`,
    confidenceScore: 30,
  };
}
