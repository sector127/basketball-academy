import {NextResponse} from 'next/server';
import {readUpload} from '@/lib/uploads';

// Public on purpose: next/image fetches these without the user's cookies.
// File names contain a random UUID, so they can't be guessed.
export async function GET(request, {params}) {
    const {filename} = await params;
    const file = await readUpload(filename);
    if (!file) {
        return NextResponse.json({error: 'File not found'}, {status: 404});
    }
    return new NextResponse(file.buffer, {
        headers: {
            'Content-Type': file.contentType,
            // Names are unique per upload, so the content never changes
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
