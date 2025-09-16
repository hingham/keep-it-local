import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { put as vercelPut, type PutCommandOptions } from '@vercel/blob';

interface BlobResult {
  url: string;
  downloadUrl?: string;
}

// Local storage implementation
async function putLocal(filename: string, file: File): Promise<BlobResult> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save file locally
  const filePath = join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  // Return URL that matches Vercel Blob format
  return {
    url: `/uploads/${filename}`,
    downloadUrl: `/uploads/${filename}`,
  };
}

// Wrapper function that uses local storage in development, Vercel Blob in production
export async function put(filename: string, file: File, options: PutCommandOptions): Promise<BlobResult> {
  if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('Using local file storage for development');
    return putLocal(filename, file);
  } else {
    console.log('Using Vercel Blob storage');
    return vercelPut(filename, file, options);
  }
}
