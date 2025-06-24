import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp'; // For image processing
import { v4 as uuidv4 } from 'uuid';
import { File } from 'multer';
export interface UploadOptions {
  resize?: {
    width: number;
    height: number;
  };
  quality: number;
  generateThumbnail?: boolean;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly publicDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Setup directories
    this.publicDir = path.join(process.cwd(), 'public');
    this.uploadDir = path.join(this.publicDir, 'uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');

    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist(): Promise<void> {
    const directories = [
      this.publicDir,
      this.uploadDir,
      path.join(this.uploadDir, 'profile-pictures'),
      path.join(this.uploadDir, 'attachments', 'images'),
      path.join(this.uploadDir, 'attachments', 'documents'),
      path.join(this.uploadDir, 'attachments', 'videos'),
      path.join(this.uploadDir, 'thumbnails', 'images'),
      path.join(this.uploadDir, 'thumbnails', 'videos'),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  // ===== PROFILE PICTURE UPLOAD =====
  async uploadProfilePicture(
    userId: string,
    file: File,
    options?: UploadOptions,
  ): Promise<string> {

    if (!file || !file.mimetype) {
      throw new BadRequestException('No file uploaded');
    }
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExtension}`;
    const uploadPath = path.join(this.uploadDir, 'profile-pictures', fileName);

    try {

      // Process and save image
      if (this.isImageFile(file.mimetype)) {
        await this.processAndSaveImage(file.buffer, uploadPath, options);
      } else {
        await fs.writeFile(uploadPath, file.buffer);
      }

      // Return public URL
      return `/uploads/profile-pictures/${fileName}`;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  // ===== MESSAGE ATTACHMENT UPLOAD =====
  async uploadMessageAttachment(
    file: File,
    messageId: string,
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    const fileType = this.getFileType(file.mimetype);
    const fileName = `${messageId}-${uuidv4()}${this.getFileExtension(file.originalname)}`;

    let uploadPath: string;
    let subDir: string;

    // Determine subdirectory based on file type
    switch (fileType) {
      case 'image':
        subDir = 'attachments/images';
        break;
      case 'video':
        subDir = 'attachments/videos';
        break;
      default:
        subDir = 'attachments/documents';
    }

    uploadPath = path.join(this.uploadDir, subDir, fileName);

    try {
      // Save original file
      if (this.isImageFile(file.mimetype)) {
        await this.processAndSaveImage(file.buffer, uploadPath, {
          quality: 85, // Compress images
        });
      } else {
        await fs.writeFile(uploadPath, file.buffer);
      }

      const fileUrl = `${this.baseUrl}/uploads/${subDir}/${fileName}`;
      let thumbnailUrl: string | undefined;

      // Generate thumbnail for images and videos
      if (fileType === 'image') {
        thumbnailUrl = await this.generateImageThumbnail(file.buffer, fileName);
      } else if (fileType === 'video') {
        // Note: Video thumbnail generation would require ffmpeg
        // For now, we'll skip video thumbnails in local setup
        // thumbnailUrl = await this.generateVideoThumbnail(uploadPath, fileName);
      }

      return { url: fileUrl, thumbnailUrl };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload attachment: ${error.message}`,
      );
    }
  }

  // ===== IMAGE PROCESSING =====
  private async processAndSaveImage(
    buffer: Buffer,
    outputPath: string,
    options?: UploadOptions,
  ): Promise<void> {
    let sharpInstance = sharp(buffer);

    // Resize if specified
    if (options?.resize) {
      sharpInstance = sharpInstance.resize(
        options.resize.width,
        options.resize.height,
        { fit: 'cover', position: 'center' },
      );
    }

    // Set quality
    const quality = options?.quality || 80;
    const ext = path.extname(outputPath).toLowerCase();

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case '.png':
        sharpInstance = sharpInstance.png({
          quality: Math.round(quality / 10),
        });
        break;
      case '.webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    await sharpInstance.toFile(outputPath);
  }

  // ===== THUMBNAIL GENERATION =====
  private async generateImageThumbnail(
    buffer: Buffer,
    originalFileName: string,
  ): Promise<string> {
    const thumbnailFileName = `thumb_${originalFileName}`;
    const thumbnailPath = path.join(
      this.uploadDir,
      'thumbnails',
      'images',
      thumbnailFileName,
    );

    await sharp(buffer)
      .resize(150, 150, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    return `${this.baseUrl}/uploads/thumbnails/images/${thumbnailFileName}`;
  }

  // ===== FILE DELETION =====
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract relative path from URL
      const relativePath = fileUrl.replace(this.baseUrl, '');
      const filePath = path.join(this.publicDir, relativePath);

      // Check if file exists and delete
      await fs.access(filePath);
      await fs.unlink(filePath);

      // Also delete thumbnail if it exists
      if (
        relativePath.includes('/attachments/images/') ||
        relativePath.includes('/profile-pictures/')
      ) {
        const fileName = path.basename(filePath);
        const thumbnailPath = path.join(
          this.uploadDir,
          'thumbnails',
          'images',
          `thumb_${fileName}`,
        );

        try {
          await fs.access(thumbnailPath);
          await fs.unlink(thumbnailPath);
        } catch {
          // Thumbnail doesn't exist, ignore
        }
      }
    } catch (error) {
      // File doesn't exist or can't be deleted, log but don't throw
      console.warn(`Failed to delete file: ${fileUrl}`, error.message);
    }
  }

  // ===== UTILITY METHODS =====
  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private getFileType(mimetype: string): 'image' | 'video' | 'document' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'document';
  }

  private isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  // ===== FILE INFO =====
  async getFileInfo(fileUrl: string): Promise<{
    exists: boolean;
    size?: number;
    type?: string;
  }> {
    try {
      const relativePath = fileUrl.replace(this.baseUrl, '');
      const filePath = path.join(this.publicDir, relativePath);
      const stats = await fs.stat(filePath);

      return {
        exists: true,
        size: stats.size,
        type: path.extname(filePath),
      };
    } catch {
      return { exists: false };
    }
  }
}
