import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket = '';
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const bucket = this.configService.get<string>('S3_BUCKET');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || endpoint.startsWith('https://your-')) {
      this.logger.warn('S3 is not fully configured. Uploads will be stored under local uploads/.');
      return;
    }

    this.s3Client = new S3Client({
      endpoint,
      region: this.configService.get<string>('S3_REGION', 'auto'),
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    this.bucket = bucket;
    this.isConfigured = true;
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '') || 'general';
    const ext = path.extname(file.originalname);
    const key = `${safeFolder}/${uuidv4()}${ext}`;

    if (!this.isConfigured || !this.s3Client) {
      const fs = await import('fs/promises');
      const localPath = path.join(process.cwd(), 'uploads', key);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, file.buffer);
      return `/uploads/${key}`;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.isConfigured || !this.s3Client || key.startsWith('/uploads/')) {
      return key;
    }
    return getSignedUrl(this.s3Client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }

  async delete(key: string): Promise<void> {
    if (!this.isConfigured || !this.s3Client || key.startsWith('/uploads/')) {
      return;
    }
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
