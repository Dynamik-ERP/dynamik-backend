import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  NotFoundException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/dxf',
  'application/x-dxf',
  'image/vnd.dxf',
  'image/x-dxf',
  'application/dwg',
  'application/x-dwg',
  'image/vnd.dwg',
  'image/x-dwg',
  'application/acad',
  'application/octet-stream',   // fallback for DWG/DXF files
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const EXT_CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.dxf': 'application/dxf',
  '.dwg': 'application/octet-stream',
};

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Query('folder') folder = 'general') {
    if (!file) throw new BadRequestException('No file provided');
    const key = await this.storageService.upload(file, folder);
    const url = await this.storageService.getSignedUrl(key);
    return { key, url, originalName: file.originalname, size: file.size };
  }

  /**
   * Serve locally-stored design files.
   * Route: GET /uploads/designs/:filename
   */
  @Get('designs/:filename')
  async serveDesignFile(@Param('filename') filename: string, @Res() res: Response) {
    // Prevent path traversal
    const safeName = path.basename(filename);
    const localPath = path.join(process.cwd(), 'uploads', 'designs', safeName);
    
    if (!fs.existsSync(localPath)) {
      throw new NotFoundException('File not found');
    }
    
    const ext = path.extname(safeName).toLowerCase();
    const contentType = EXT_CONTENT_TYPES[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    
    const stream = fs.createReadStream(localPath);
    stream.pipe(res);
  }
}
