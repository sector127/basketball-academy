import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import { UploadError, isUploadedFile, saveImageUpload } from '@/lib/uploads';

// Image upload for forms that store an image path (e.g. coach photos)
export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const path = await saveImageUpload(file);
    return NextResponse.json({ path }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
