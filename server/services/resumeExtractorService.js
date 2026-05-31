import fs from 'fs';
import path from 'path';

/**
 * Extract raw text from a resume file.
 * Supports PDF (via pdf-parse) and plain text files.
 * Falls back gracefully if pdf-parse is not yet installed.
 */
export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    try {
      // Dynamic import so the server still boots even if pdf-parse is missing
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return (data.text || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      console.warn('[resumeExtractor] pdf-parse failed, falling back to empty string:', err.message);
      return '';
    }
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8').replace(/\s+/g, ' ').trim();
  }

  return '';
}
