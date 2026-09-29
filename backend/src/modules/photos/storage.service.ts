import { env } from '../../config/env';
import { generateOpaqueToken } from '../../utils/crypto';

export class StorageService {
  /**
   * Generates presigned URLs for client-side direct upload to S3 / Object Storage.
   * Storage key format: profiles/{userId}/{randomUUID}.{ext}
   * Never contains phone number, national ID, or PII.
   */
  async getPresignedUploadUrl(
    userId: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; storageKey: string; blurredStorageKey: string }> {
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const ext = extMap[mimeType] || 'jpg';
    const randomId = generateOpaqueToken(16);
    const storageKey = `profiles/${userId}/${randomId}.${ext}`;
    const blurredStorageKey = `profiles/${userId}/${randomId}_blurred.${ext}`;

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
