import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import crypto from 'node:crypto';

@Injectable()
export class CloudinaryService {
  async uploadAvatar(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new Error('No file buffer provided');
    }

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    return new Promise((resolve, reject) => {
      const uploadedStream = cloudinary.uploader.upload_stream(
        {
          folder: 'PM-System-Api/Avatars',
          public_id: fileHash,
          resource_type: 'image',
          allowed_formats: ['png', 'jpg'],
          overwrite: false,
          unique_filename: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(new Error(error.message || 'Avatar upload failed'));
          }
          if (!result) {
            return reject(
              new Error('Cloudinary upload returned an empty response.'),
            );
          }
          resolve(result);
        },
      );

      uploadedStream.end(file.buffer);
    });
  }

  async destroyFile(publicId: string): Promise<UploadApiResponse> {
    const response = (await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    })) as UploadApiResponse;

    if (response.result !== 'ok' && response.result !== 'not found') {
      throw new Error(
        `Cloudinary deletion failed with status: ${response.result}`,
      );
    }
    return response;
  }

  async uploadAttachment(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new Error('No file buffer provided');
    }

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    return new Promise((resolve, reject) => {
      const uploadedStream = cloudinary.uploader.upload_stream(
        {
          folder: 'PM-System-Api/Attachements',
          resource_type: 'auto',
          public_id: fileHash,
          overwrite: false,
          unique_filename: false,
          allowed_formats: ['pdf', 'docx', 'png'],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(new Error(error.message || 'Document upload failed'));
          }
          if (!result) {
            return reject(
              new Error('Cloudinary upload returned an empty response.'),
            );
          }
          resolve(result);
        },
      );

      uploadedStream.end(file.buffer);
    });
  }
}
