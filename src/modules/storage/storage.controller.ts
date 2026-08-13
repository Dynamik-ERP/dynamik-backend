import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/dxf',
  'application/octet-stream',
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
}
