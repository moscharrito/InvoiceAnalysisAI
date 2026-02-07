import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Store evidence image to disk and database
export async function storeEvidenceImage(
  claimId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  evidenceType: string = 'damage_photo'
): Promise<{ id: string; filePath: string; fileSize: number }> {
  ensureUploadsDir();

  const ext = path.extname(fileName) || '.jpg';
  const storedName = `${claimId}_${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, storedName);

  fs.writeFileSync(filePath, buffer);

  const evidence = await prisma.claimEvidence.create({
    data: {
      claimId,
      fileName,
      fileType: mimeType,
      filePath: storedName,
      fileSize: buffer.length,
      evidenceType,
    },
  });

  return {
    id: evidence.id,
    filePath: storedName,
    fileSize: buffer.length,
  };
}

// Get all evidence images for a claim as base64
export async function getEvidenceImagesAsBase64(
  claimId: string
): Promise<Array<{ id: string; base64: string; mimeType: string; fileName: string }>> {
  const evidenceRecords = await prisma.claimEvidence.findMany({
    where: { claimId },
  });

  const results: Array<{ id: string; base64: string; mimeType: string; fileName: string }> = [];

  for (const record of evidenceRecords) {
    if (record.filePath) {
      const fullPath = path.join(UPLOADS_DIR, record.filePath);
      if (fs.existsSync(fullPath)) {
        let buffer = fs.readFileSync(fullPath);

        // Resize large images to reduce API costs
        try {
          const sharp = require('sharp');
          const metadata = await sharp(buffer).metadata();
          if (metadata.width && metadata.width > 1024) {
            buffer = await sharp(buffer)
              .resize(1024, null, { withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer();
          }
        } catch {
          // sharp not available or image processing failed, use original
        }

        results.push({
          id: record.id,
          base64: buffer.toString('base64'),
          mimeType: record.fileType,
          fileName: record.fileName,
        });
      }
    }
  }

  return results;
}

// Get evidence records for a claim
export async function getEvidenceRecords(claimId: string) {
  return prisma.claimEvidence.findMany({
    where: { claimId },
    orderBy: { createdAt: 'desc' },
  });
}
