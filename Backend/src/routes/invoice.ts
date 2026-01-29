import { Router, Request, Response } from 'express';
import multer from 'multer';
import { analyzeInvoice } from '../services/azureOCR';

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
  }
});

// POST /api/invoice/analyze - Analyze an uploaded invoice
router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // Process with Azure OCR
    const result = await analyzeInvoice(file.buffer, file.mimetype);

    return res.json({
      success: true,
      data: result,
      fileName: file.originalname,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Invoice processing error:', error);
    return res.status(500).json({
      error: 'Failed to process invoice',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/invoice/status - Check API status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    azureConfigured: !!(process.env.AZURE_ENDPOINT && process.env.AZURE_KEY)
  });
});

export default router;
