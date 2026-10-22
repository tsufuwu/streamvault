/**
 * Cloudflare Pages Function: /stream-media/:fileId
 *
 * Proxies and streams media from Google Drive with full HTTP Range request support
 * for smooth video seeking, fast forward, and buffer streaming.
 */

export async function onRequest(context) {
  const fileId = context.params.fileId;
  if (!fileId || !/^[\w-]{10,}$/.test(fileId)) {
    return new Response('Invalid or missing fileId', { status: 400 });
  }

  const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range, Accept, Content-Type',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  // Forward Range headers for seeking
  const rangeHeader = context.request.headers.get('range');
  const reqHeaders = new Headers();
  reqHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  reqHeaders.set('Accept', 'video/*,audio/*,*/*');
  if (rangeHeader) {
    reqHeaders.set('Range', rangeHeader);
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: context.request.method,
      headers: reqHeaders,
      redirect: 'follow',
    });

    const resHeaders = new Headers(upstreamRes.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    resHeaders.set('Accept-Ranges', 'bytes');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    // If proxy fetch fails, fallback to 302 redirect
    return Response.redirect(targetUrl, 302);
  }
}
