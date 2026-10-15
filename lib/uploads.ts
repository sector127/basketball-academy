import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

// Files under public/ are only served if they existed at build time, so runtime
// uploads live outside it and are served by app/api/uploads/[filename]/route.js.
// Mount this directory as a volume in production.
export const UPLOAD_DIR: string = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
export const UPLOAD_URL_PREFIX: string = '/api/uploads/';
// Images committed with the app (and older uploads) are still served from public/uploads
const LEGACY_PREFIX: string = '/uploads/';
const LEGACY_DIR: string = join(process.cwd(), 'public', 'uploads');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ImageSignature {
  type: string;
  ext: string;
  matches: (b: Buffer) => boolean;
}

// Detect the real type from the file's first bytes instead of trusting the client
const IMAGE_SIGNATURES: readonly ImageSignature[] = [
  { type: 'image/jpeg', ext: '.jpg', matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: 'image/png',
    ext: '.png',
    matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: 'image/webp',
    ext: '.webp',
    matches: (b: Buffer) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
] as const;

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface UploadedFileLike {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function isUploadedFile(value: unknown): value is UploadedFileLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'arrayBuffer' in value &&
      typeof (value as { arrayBuffer: unknown }).arrayBuffer === 'function' &&
      'size' in value &&
      typeof (value as { size: unknown }).size === 'number' &&
      (value as { size: number }).size > 0
  );
}

/**
 * Validates and stores an uploaded image (JPEG, PNG or WebP, max 5MB).
 * Returns the public URL path to store on the document.
 */
export async function saveImageUpload(file: UploadedFileLike): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError('File size exceeds 5MB limit');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const signature = IMAGE_SIGNATURES.find((s) => s.matches(buffer));
  if (!signature) {
    throw new UploadError('Invalid file type. Only JPEG, PNG, and WebP are allowed');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}${signature.ext}`;
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `${UPLOAD_URL_PREFIX}${filename}`;
}

/**
 * Deletes a previously uploaded file. Shared defaults are never deleted.
 */
export async function deleteUpload(urlPath: string | null | undefined): Promise<void> {
  if (!urlPath || urlPath.includes('default-profile-picture')) return;
  let filePath: string | null = null;
  if (urlPath.startsWith(UPLOAD_URL_PREFIX)) {
    filePath = join(UPLOAD_DIR, basename(urlPath));
  } else if (urlPath.startsWith(LEGACY_PREFIX)) {
    filePath = join(LEGACY_DIR, basename(urlPath));
  }
  if (!filePath || !existsSync(filePath)) return;
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Error deleting upload:', error);
  }
}

export interface ReadUploadResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Reads an uploaded file by name. Returns null if it doesn't exist.
 */
export async function readUpload(filename: string): Promise<ReadUploadResult | null> {
  const safeName = basename(filename);
  const signature = IMAGE_SIGNATURES.find((s) => safeName.toLowerCase().endsWith(s.ext));
  const filePath = join(UPLOAD_DIR, safeName);
  if (!signature || safeName !== filename || !existsSync(filePath)) return null;
  return { buffer: await readFile(filePath), contentType: signature.type };
}

/**
 * Image paths stored on users/players must point at files this app serves,
 * since next/image rejects unconfigured remote hosts.
 */
export function isLocalImagePath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('..');
}
