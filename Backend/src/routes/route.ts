import { NextRequest, NextResponse } from 'next/server';
import { analyzeInvoice } from '../../lib/azureOCR';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.'
      }, { status: 400 });
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 20MB.'
      }, { status: 400 });
    }

    // Process with Azure OCR
    const result = await analyzeInvoice(file);

    return NextResponse.json({
      success: true,
      data: result,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Invoice processing error:', error);
    return NextResponse.json({
      error: 'Failed to process invoice',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
