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
  getInvoiceById,
  getInvoicesByClaim,
  generateClaimNumber,
  createClaimEvidence,
  getEvidenceByClaim,
  updateClaimWithLLMAnalysis,
  updateInvoiceWithLLMAnalysis,
  ClaimInput,
  ClaimStatus,
} from '../services/claimService';
import { analyzeClaimWithLLM } from '../services/claimAnalysis';
import { storeEvidenceImage, getEvidenceImagesAsBase64 } from '../services/imageStorage';

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

// GET /api/claims/generate-number - Generate a new claim number
router.get('/generate-number', async (req: Request, res: Response) => {
  try {
    const claimNumber = await generateClaimNumber();
    return res.json({
      success: true,
      claimNumber,
    });
  } catch (error) {
    console.error('Generate claim number error:', error);
    return res.status(500).json({
      error: 'Failed to generate claim number',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/claims - Create a new claim
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: ClaimInput = req.body;

    // Validate required fields (claimNumber is now optional - will be auto-generated)
    if (!input.policyNumber || !input.claimantName ||
        !input.propertyAddress || !input.dateOfLoss || !input.causeOfLoss) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['policyNumber', 'claimantName', 'propertyAddress', 'dateOfLoss', 'causeOfLoss'],
      });
    }

    // Check if claim number already exists (only if provided)
    if (input.claimNumber) {
      const existing = await getClaimByNumber(input.claimNumber);
      if (existing) {
        return res.status(409).json({
          error: 'Claim number already exists',
          claimId: existing.id,
        });
      }
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

// POST /api/claims/:id/documents - Upload invoices and evidence, then run LLM analysis
router.post(
  '/:id/documents',
  upload.fields([
    { name: 'invoices', maxCount: 5 },
    { name: 'evidence', maxCount: 10 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const claimId = req.params.id;

      const claim = await getClaimById(claimId);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const invoiceFiles = files?.invoices || [];
      const evidenceFiles = files?.evidence || [];

      if (invoiceFiles.length === 0 && evidenceFiles.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      await updateClaimStatus(claimId, ClaimStatus.IN_PROGRESS);

      // Process invoice files with OCR
      const processedInvoices = [];
      const ocrResults = [];

      for (const file of invoiceFiles) {
        const invoice = await createClaimInvoice(claimId, {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
        });

        const ocrResult = await analyzeInvoice(file.buffer, file.mimetype);

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

        // Run basic validation
        const updatedInvoice = await getInvoiceById(invoice.id);
        if (updatedInvoice) {
          const flags = validateInvoice(
            {
              invoiceDate: updatedInvoice.invoiceDate,
              totalAmount: updatedInvoice.totalAmount,
              lineItems: updatedInvoice.lineItems,
              vendorName: updatedInvoice.vendorName,
            },
            claim.dateOfLoss
          );
          await updateInvoiceValidation(invoice.id, flags);
        }

        processedInvoices.push(invoice);
        ocrResults.push({
          invoiceId: invoice.id,
          ...ocrResult,
        });
      }

      // Store evidence images
      for (const file of evidenceFiles) {
        await storeEvidenceImage(claimId, file.buffer, file.originalname, file.mimetype);
      }

      // Prepare data for LLM analysis
      const invoiceDataForLLM = ocrResults.map(ocr => ({
        vendorName: ocr.vendorName,
        vendorAddress: ocr.vendorAddress,
        invoiceNumber: ocr.invoiceNumber,
        invoiceDate: ocr.invoiceDate,
        totalAmount: ocr.totalAmount,
        lineItems: ocr.lineItems?.map((item: any) => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }));

      // Get evidence images as base64 for LLM
      const evidenceImages = await getEvidenceImagesAsBase64(claimId);

      // Run LLM analysis
      const llmAnalysis = await analyzeClaimWithLLM(
        {
          claimNumber: claim.claimNumber,
          policyNumber: claim.policyNumber,
          claimantName: claim.claimantName,
          propertyAddress: claim.propertyAddress,
          dateOfLoss: claim.dateOfLoss.toISOString().split('T')[0],
          causeOfLoss: claim.causeOfLoss,
        },
        invoiceDataForLLM,
        evidenceImages
      );

      // Store LLM results on claim
      await updateClaimWithLLMAnalysis(claimId, llmAnalysis);

      // Store LLM results on each invoice
      for (const invoice of processedInvoices) {
        await updateInvoiceWithLLMAnalysis(invoice.id, llmAnalysis);
      }

      // Get final state
      const finalClaim = await getClaimById(claimId);
      const finalInvoices = await getInvoicesByClaim(claimId);
      const evidence = await getEvidenceByClaim(claimId);

      return res.json({
        success: true,
        data: {
          claim: finalClaim,
          invoices: finalInvoices,
          evidence,
          ocrResults,
          llmAnalysis,
        },
      });
    } catch (error) {
      console.error('Document processing error:', error);
      return res.status(500).json({
        error: 'Failed to process documents',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// POST /api/claims/:id/evidence - Upload evidence photos separately
router.post(
  '/:id/evidence',
  upload.array('evidence', 10),
  async (req: Request, res: Response) => {
    try {
      const claimId = req.params.id;

      const claim = await getClaimById(claimId);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const evidenceRecords = [];
      for (const file of files) {
        const record = await storeEvidenceImage(claimId, file.buffer, file.originalname, file.mimetype);
        evidenceRecords.push(record);
      }

      return res.json({
        success: true,
        data: evidenceRecords,
      });
    } catch (error) {
      console.error('Evidence upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload evidence',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// POST /api/claims/:id/analyze - Re-trigger LLM analysis
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;

    const claim = await getClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const invoices = await getInvoicesByClaim(claimId);
    if (invoices.length === 0) {
      return res.status(400).json({ error: 'No invoices found for this claim. Upload invoices first.' });
    }

    // Build invoice data from stored OCR results
    const invoiceDataForLLM = invoices.map(inv => ({
      vendorName: inv.vendorName || undefined,
      vendorAddress: inv.vendorAddress || undefined,
      invoiceNumber: inv.invoiceNumber || undefined,
      invoiceDate: inv.invoiceDate?.toISOString().split('T')[0],
      totalAmount: inv.totalAmount || undefined,
      lineItems: inv.lineItems ? JSON.parse(inv.lineItems).map((item: any) => ({
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })) : undefined,
    }));

    const evidenceImages = await getEvidenceImagesAsBase64(claimId);

    const llmAnalysis = await analyzeClaimWithLLM(
      {
        claimNumber: claim.claimNumber,
        policyNumber: claim.policyNumber,
        claimantName: claim.claimantName,
        propertyAddress: claim.propertyAddress,
        dateOfLoss: claim.dateOfLoss.toISOString().split('T')[0],
        causeOfLoss: claim.causeOfLoss,
      },
      invoiceDataForLLM,
      evidenceImages
    );

    await updateClaimWithLLMAnalysis(claimId, llmAnalysis);

    for (const invoice of invoices) {
      await updateInvoiceWithLLMAnalysis(invoice.id, llmAnalysis);
    }

    const finalClaim = await getClaimById(claimId);

    return res.json({
      success: true,
      data: {
        claim: finalClaim,
        llmAnalysis,
      },
    });
  } catch (error) {
    console.error('Re-analysis error:', error);
    return res.status(500).json({
      error: 'Failed to re-analyze claim',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/claims/:id/invoices - Upload and process single invoice (legacy support)
router.post('/:id/invoices', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;

    const claim = await getClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    await updateClaimStatus(claimId, ClaimStatus.IN_PROGRESS);

    const invoice = await createClaimInvoice(claimId, {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });

    const ocrResult = await analyzeInvoice(file.buffer, file.mimetype);

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

    const updatedInvoice = await getInvoiceById(invoice.id);
    if (!updatedInvoice) {
      throw new Error('Invoice not found after update');
    }

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

    const finalInvoice = await getInvoiceById(invoice.id);

    return res.json({
      success: true,
      data: {
        invoice: finalInvoice,
        ocrResult,
        validationFlags,
      },
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
