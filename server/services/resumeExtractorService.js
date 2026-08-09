import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Extract raw text from a resume file.
 * Supports PDF (pdf-parse v2 PDFParse class) and plain text files.
 */
export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    try {
      const mod = require('pdf-parse');
      const PDFParse = mod.PDFParse || mod.default?.PDFParse || mod.default;

      if (typeof PDFParse !== 'function') {
        throw new Error('pdf-parse PDFParse class is unavailable');
      }

      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        const text = (result?.text || '')
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return text;
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
      }
    } catch (err) {
      console.error('[resumeExtractor] ERROR:', err.message);
      return '';
    }
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8').replace(/\s+/g, ' ').trim();
  }

  return '';
}
