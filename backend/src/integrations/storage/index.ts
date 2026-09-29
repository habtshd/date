import { env } from '../../config/env';
import { generateOpaqueToken } from '../../utils/crypto';

export class StorageService {
  /**
   * Generates presigned URLs for client-side direct upload to S3 / Object Storage
   */
  async getPresignedUploadUrl(userId: string, mimeType: string): Promise<{ uploadUrl: string; storageKey: string; blurredStorageKey: string }> {
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileId = generateOpaqueToken(16);
    const storageKey = `photos/${userId}/${fileId}.${ext}`;
    const blurredStorageKey = `photos/${userId}/${fileId}_blurred.${ext}`;

    // Presigned S3 PUT URL
    const endpoint = env.STORAGE_ENDPOINT || 'https://storage.habeshadate.et';
    const uploadUrl = `${endpoint}/${env.STORAGE_BUCKET}/${storageKey}?mock_upload_sig=${generateOpaqueToken(8)}`;

    return {
      uploadUrl,
      storageKey,
      blurredStorageKey,
    };
  }
}

export const storageService = new StorageService();
