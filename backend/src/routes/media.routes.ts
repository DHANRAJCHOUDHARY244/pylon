import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Router } from 'express';
import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { authenticate } from '../middleware/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ValidationError } from '../utils/errors.js';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');
const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

function ensureUploadDir() {
  if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });
}

class MediaController extends BaseController {
  upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { dataUrl?: string; filename?: string; kind?: string };
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : '';
    if (!dataUrl.startsWith('data:')) {
      throw new ValidationError('Expected a data URL (upload file or paste image)');
    }

    const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) throw new ValidationError('Invalid data URL');

    const mime = match[1]!.toLowerCase();
    const ext = MIME_EXT[mime];
    if (!ext) throw new ValidationError('Only JPEG, PNG, WebP, GIF, or PDF allowed');

    const buffer = Buffer.from(match[2]!, 'base64');
    if (buffer.byteLength > MAX_BYTES) {
      throw new ValidationError('File too large (max 8MB)');
    }

    ensureUploadDir();
    const safeName = (body.filename || 'asset')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 40);
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}${ext}`;
    const abs = join(UPLOAD_ROOT, filename);

    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(abs);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
      stream.end(buffer);
    });

    const url = `/uploads/${filename}`;
    return this.created(res, {
      url,
      filename,
      mime,
      bytes: buffer.byteLength,
      kind: body.kind ?? 'file',
    });
  });
}

const mediaController = new MediaController();
const router = Router();

router.post('/upload', authenticate, mediaController.upload);

export default router;
export { UPLOAD_ROOT };
