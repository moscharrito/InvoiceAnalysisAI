import { Router, Request, Response } from 'express';
import multer from 'multer';
import { analyzeInvoice } from '../services/azureOCR';
import {
  createClaim,
  getClaimById,
  getClaimByNumber,
  getClaims,
  updateClaimStatus,
  createClaimInvoice,
  updateInvoiceWithOCR,
  validateInvoice,
  updateInvoiceValidation,
  calculateCoverageAndRecommendation,
  getInvoiceById,
  getInvoicesByClaim,
  ClaimInput,
} from '../services/claimService';
import { ClaimStatus } from '@prisma/client';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.'));
    }
  },
});

// POST /api/claims - Create a new claim
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: ClaimInput = req.body;

    // Validate required fields
    if (!input.claimNumber || !input.policyNumber || !input.claimantName ||
        !input.propertyAddress || !input.dateOfLoss || !input.causeOfLoss) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['claimNumber', 'policyNumber', 'claimantName', 'propertyAddress', 'dateOfLoss', 'causeOfLoss'],
      });
    }

    // Check if claim number already exists
    const existing = await getClaimByNumber(input.claimNumber);
    if (existing) {
      return res.status(409).json({
        error: 'Claim number already exists',
        claimId: existing.id,
      });
    }

    const claim = await createClaim(input);

    return res.status(201).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error('Create claim error:', error);
    return res.status(500).json({
      error: 'Failed to create claim',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/claims - Get all claims
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getClaims(page, limit);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get claims error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve claims',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/claims/:id - Get claim by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const claim = await getClaimById(req.params.id);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    return res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error('Get claim error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve claim',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PATCH /api/claims/:id/status - Update claim status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !Object.values(ClaimStatus).includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses: Object.values(ClaimStatus),
      });
    }

    const claim = await updateClaimStatus(req.params.id, status);

    return res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    return res.status(500).json({
      error: 'Failed to update claim status',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/claims/:id/invoices - Upload and process invoice for a claim
router.post('/:id/invoices', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;

    // Get the claim
    const claim = await getClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // Update claim status to in progress
    await updateClaimStatus(claimId, ClaimStatus.IN_PROGRESS);

    // Create invoice record
    const invoice = await createClaimInvoice(claimId, {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });

    // Process with Azure OCR
    const ocrResult = await analyzeInvoice(file.buffer, file.mimetype);

    // Update invoice with OCR results
    await updateInvoiceWithOCR(invoice.id, {
      vendorName: ocrResult.vendorName,
      vendorAddress: ocrResult.vendorAddress,
      invoiceNumber: ocrResult.invoiceNumber,
      invoiceDate: ocrResult.invoiceDate,
      dueDate: ocrResult.dueDate,
      totalAmount: ocrResult.totalAmount,
      currency: ocrResult.currency || 'USD',
      lineItems: ocrResult.lineItems,
      ocrRawData: JSON.stringify(ocrResult),
      ocrConfidence: ocrResult.confidence,
    });

    // Get updated invoice
    const updatedInvoice = await getInvoiceById(invoice.id);
    if (!updatedInvoice) {
      throw new Error('Invoice not found after update');
    }

    // Validate invoice against claim
    const validationFlags = validateInvoice(
      {
        invoiceDate: updatedInvoice.invoiceDate,
        totalAmount: updatedInvoice.totalAmount,
        lineItems: updatedInvoice.lineItems,
        vendorName: updatedInvoice.vendorName,
      },
      claim.dateOfLoss
    );

    await updateInvoiceValidation(invoice.id, validationFlags);

    // Calculate coverage (simplified - in production this would be more complex)
    const totalAmount = updatedInvoice.totalAmount || 0;
    const coveredAmount = totalAmount * 0.85; // Assume 85% covered
    const nonCoveredAmount = totalAmount * 0.15;
    const depreciation = coveredAmount * 0.1; // 10% depreciation
    const deductible = 1000; // Example deductible

    await calculateCoverageAndRecommendation(invoice.id, {
      coveredAmount,
      nonCoveredAmount,
      depreciation,
      deductible,
      coverageDetails: {
        coveredItems: ocrResult.lineItems?.slice(0, Math.ceil((ocrResult.lineItems?.length || 0) * 0.85)),
        nonCoveredItems: ocrResult.lineItems?.slice(Math.ceil((ocrResult.lineItems?.length || 0) * 0.85)),
        depreciationRate: 0.1,
        policyDeductible: deductible,
      },
    });

    // Get final invoice state
    const finalInvoice = await getInvoiceById(invoice.id);

    return res.json({
      success: true,
      data: {
        invoice: finalInvoice,
        ocrResult,
        validationFlags,
        coverage: {
          coveredAmount,
          nonCoveredAmount,
          depreciation,
          deductible,
          recommendedPayout: finalInvoice?.recommendedPayout,
        },
      },
      fileName: file.originalname,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Invoice processing error:', error);
    return res.status(500).json({
      error: 'Failed to process invoice',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/claims/:id/invoices - Get all invoices for a claim
router.get('/:id/invoices', async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;

    const claim = await getClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const invoices = await getInvoicesByClaim(claimId);

    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve invoices',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/claims/invoices/:invoiceId - Get specific invoice
router.get('/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const invoice = await getInvoiceById(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve invoice',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
