import prisma from '../lib/prisma';
import { ClaimStatus, ValidationStatus, AdjudicationStatus } from '@prisma/client';

// Validation rules (matching frontend)
export const VALIDATION_RULES = {
  MAX_INVOICE_AMOUNT: 100000,
  MAX_LINE_ITEM_AMOUNT: 25000,
  MIN_INVOICE_DATE_DAYS_AFTER_LOSS: 0,
  MAX_INVOICE_DATE_DAYS_AFTER_LOSS: 365,
  SUSPICIOUS_ROUND_AMOUNT_THRESHOLD: 1000,
  REQUIRED_FIELDS: ['vendorName', 'invoiceDate', 'totalAmount'],
};

export interface ClaimInput {
  claimNumber: string;
  policyNumber: string;
  claimantName: string;
  propertyAddress: string;
  dateOfLoss: string;
  causeOfLoss: string;
}

export interface ValidationFlag {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

// Create a new claim
export async function createClaim(input: ClaimInput) {
  return prisma.claim.create({
    data: {
      claimNumber: input.claimNumber,
      policyNumber: input.policyNumber,
      claimantName: input.claimantName,
      propertyAddress: input.propertyAddress,
      dateOfLoss: new Date(input.dateOfLoss),
      causeOfLoss: input.causeOfLoss,
      status: ClaimStatus.PENDING,
    },
  });
}

// Get claim by ID
export async function getClaimById(id: string) {
  return prisma.claim.findUnique({
    where: { id },
    include: { invoices: true },
  });
}

// Get claim by claim number
export async function getClaimByNumber(claimNumber: string) {
  return prisma.claim.findUnique({
    where: { claimNumber },
    include: { invoices: true },
  });
}

// Get all claims with pagination
export async function getClaims(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [claims, total] = await Promise.all([
    prisma.claim.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { invoices: true },
    }),
    prisma.claim.count(),
  ]);

  return {
    claims,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Update claim status
export async function updateClaimStatus(id: string, status: ClaimStatus) {
  return prisma.claim.update({
    where: { id },
    data: { status },
  });
}

// Create invoice for a claim
export async function createClaimInvoice(
  claimId: string,
  fileInfo: { fileName: string; fileType: string; fileSize?: number; filePath?: string }
) {
  return prisma.claimInvoice.create({
    data: {
      claimId,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
      fileSize: fileInfo.fileSize,
      filePath: fileInfo.filePath,
    },
  });
}

// Update invoice with OCR results
export async function updateInvoiceWithOCR(
  invoiceId: string,
  ocrData: {
    vendorName?: string;
    vendorAddress?: string;
    vendorPhone?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount?: number;
    currency?: string;
    lineItems?: unknown[];
    ocrRawData?: string;
    ocrConfidence?: number;
  }
) {
  return prisma.claimInvoice.update({
    where: { id: invoiceId },
    data: {
      vendorName: ocrData.vendorName,
      vendorAddress: ocrData.vendorAddress,
      vendorPhone: ocrData.vendorPhone,
      invoiceNumber: ocrData.invoiceNumber,
      invoiceDate: ocrData.invoiceDate ? new Date(ocrData.invoiceDate) : null,
      dueDate: ocrData.dueDate ? new Date(ocrData.dueDate) : null,
      totalAmount: ocrData.totalAmount,
      currency: ocrData.currency || 'USD',
      lineItems: ocrData.lineItems ? JSON.stringify(ocrData.lineItems) : null,
      ocrRawData: ocrData.ocrRawData,
      ocrConfidence: ocrData.ocrConfidence,
      processedAt: new Date(),
    },
  });
}

// Validate invoice against claim and rules
export function validateInvoice(
  invoice: {
    invoiceDate?: Date | null;
    totalAmount?: number | null;
    lineItems?: string | null;
    vendorName?: string | null;
  },
  claimDateOfLoss: Date
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // Check required fields
  if (!invoice.vendorName) {
    flags.push({
      code: 'MISSING_VENDOR',
      severity: 'error',
      message: 'Vendor name is required',
      field: 'vendorName',
    });
  }

  if (!invoice.invoiceDate) {
    flags.push({
      code: 'MISSING_DATE',
      severity: 'error',
      message: 'Invoice date is required',
      field: 'invoiceDate',
    });
  }

  if (invoice.totalAmount === null || invoice.totalAmount === undefined) {
    flags.push({
      code: 'MISSING_AMOUNT',
      severity: 'error',
      message: 'Total amount is required',
      field: 'totalAmount',
    });
  }

  // Check invoice date relative to loss date
  if (invoice.invoiceDate) {
    const daysDiff = Math.floor(
      (invoice.invoiceDate.getTime() - claimDateOfLoss.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < VALIDATION_RULES.MIN_INVOICE_DATE_DAYS_AFTER_LOSS) {
      flags.push({
        code: 'INVOICE_BEFORE_LOSS',
        severity: 'error',
        message: 'Invoice date is before date of loss',
        field: 'invoiceDate',
      });
    }

    if (daysDiff > VALIDATION_RULES.MAX_INVOICE_DATE_DAYS_AFTER_LOSS) {
      flags.push({
        code: 'INVOICE_TOO_OLD',
        severity: 'warning',
        message: `Invoice date is more than ${VALIDATION_RULES.MAX_INVOICE_DATE_DAYS_AFTER_LOSS} days after loss`,
        field: 'invoiceDate',
      });
    }
  }

  // Check total amount threshold
  if (invoice.totalAmount !== null && invoice.totalAmount !== undefined) {
    if (invoice.totalAmount > VALIDATION_RULES.MAX_INVOICE_AMOUNT) {
      flags.push({
        code: 'AMOUNT_EXCEEDS_THRESHOLD',
        severity: 'warning',
        message: `Total amount exceeds $${VALIDATION_RULES.MAX_INVOICE_AMOUNT.toLocaleString()} threshold`,
        field: 'totalAmount',
      });
    }

    // Check for suspicious round amounts
    if (
      invoice.totalAmount >= VALIDATION_RULES.SUSPICIOUS_ROUND_AMOUNT_THRESHOLD &&
      invoice.totalAmount % 1000 === 0
    ) {
      flags.push({
        code: 'SUSPICIOUS_ROUND_AMOUNT',
        severity: 'info',
        message: 'Total amount is a round number, may require additional verification',
        field: 'totalAmount',
      });
    }
  }

  // Check line items
  if (invoice.lineItems) {
    try {
      const items = JSON.parse(invoice.lineItems) as Array<{ amount?: number; description?: string }>;
      for (const item of items) {
        if (item.amount && item.amount > VALIDATION_RULES.MAX_LINE_ITEM_AMOUNT) {
          flags.push({
            code: 'LINE_ITEM_EXCEEDS_THRESHOLD',
            severity: 'warning',
            message: `Line item exceeds $${VALIDATION_RULES.MAX_LINE_ITEM_AMOUNT.toLocaleString()} threshold`,
            field: 'lineItems',
          });
          break;
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  return flags;
}

// Update invoice validation status
export async function updateInvoiceValidation(
  invoiceId: string,
  flags: ValidationFlag[]
) {
  const hasErrors = flags.some((f) => f.severity === 'error');
  const hasWarnings = flags.some((f) => f.severity === 'warning');

  let validationStatus: ValidationStatus;
  if (hasErrors) {
    validationStatus = ValidationStatus.FAILED;
  } else if (hasWarnings) {
    validationStatus = ValidationStatus.FLAGGED;
  } else {
    validationStatus = ValidationStatus.PASSED;
  }

  return prisma.claimInvoice.update({
    where: { id: invoiceId },
    data: {
      validationFlags: JSON.stringify(flags),
      validationStatus,
    },
  });
}

// Calculate coverage and generate recommendation
export async function calculateCoverageAndRecommendation(
  invoiceId: string,
  analysis: {
    coveredAmount: number;
    nonCoveredAmount: number;
    depreciation: number;
    deductible: number;
    coverageDetails: unknown;
  }
) {
  const recommendedPayout = Math.max(
    0,
    analysis.coveredAmount - analysis.depreciation - analysis.deductible
  );

  // Determine adjudication recommendation
  let adjudicationStatus: AdjudicationStatus;
  if (recommendedPayout > 0) {
    adjudicationStatus = AdjudicationStatus.RECOMMENDED_APPROVE;
  } else if (analysis.nonCoveredAmount > analysis.coveredAmount) {
    adjudicationStatus = AdjudicationStatus.RECOMMENDED_DENY;
  } else {
    adjudicationStatus = AdjudicationStatus.RECOMMENDED_REVIEW;
  }

  return prisma.claimInvoice.update({
    where: { id: invoiceId },
    data: {
      coverageAnalysis: JSON.stringify(analysis.coverageDetails),
      coveredAmount: analysis.coveredAmount,
      nonCoveredAmount: analysis.nonCoveredAmount,
      depreciation: analysis.depreciation,
      deductible: analysis.deductible,
      recommendedPayout,
      adjudicationStatus,
    },
  });
}

// Get invoice by ID with claim
export async function getInvoiceById(invoiceId: string) {
  return prisma.claimInvoice.findUnique({
    where: { id: invoiceId },
    include: { claim: true },
  });
}

// Get all invoices for a claim
export async function getInvoicesByClaim(claimId: string) {
  return prisma.claimInvoice.findMany({
    where: { claimId },
    orderBy: { createdAt: 'desc' },
  });
}
