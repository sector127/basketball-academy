import { NextRequest, NextResponse } from 'next/server';
import { readUpload } from '@/lib/uploads';

interface RouteContext {
  params: Promise<{ filename: string }> | { filename: string };
}

// Public on purpose: next/image fetches these without the user's cookies.
// File names contain a random UUID, so they can't be guessed.
export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { filename } = await Promise.resolve(context.params);
  const file = await readUpload(filename);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
  return new NextResponse(file.buffer as BodyInit, {
    headers: {
      'Content-Type': file.contentType,
      // Names are unique per upload, so the content never changes
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
