import { NextResponse, type NextRequest } from 'next/server.js';
import { allowedPreviewServerRequest, previewCsp } from './policy.ts';

// Only the preview branch of proxy calls this. No auth or Supabase client exists
// on this path, including when the original authority is rejected.
export function previewServerResponse(request: NextRequest) {
  if (!allowedPreviewServerRequest(request.url, request.method, request.headers)) {
    return new NextResponse('Read-only preview: request blocked.', {
      status: 403, headers: { 'Cache-Control': 'no-store', 'Content-Security-Policy': previewCsp },
    });
  }
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.delete('authorization');
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', previewCsp);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
