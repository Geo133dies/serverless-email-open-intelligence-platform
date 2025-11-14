# create file
cat > api/open.js <<'EOF'
/*
  Vercel serverless endpoint: /api/open
  - Receives GET requests from email clients (img src)
  - Forwards JSON to Google Apps Script webhook (APPSCRIPT_WEBHOOK env var)
  - Responds with a 1x1 gif pixel
*/

export default async function handler(req, res) {
  try {
    // Accept GET query params mid (mail id) and optional v (nonce)
    const { mid = 'unknown', v = '' } = req.query || {};

    const ts = new Date().toISOString();
    const ua = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

    const payload = {
      mid,
      ts,
      ua,
      ip,
      forwardedFrom: 'vercel',
      note: v ? `v=${v}` : ''
    };

    // Forward to Apps Script webhook (must be set in Vercel env)
    const webhook = process.env.APPSCRIPT_WEBHOOK;
    if (!webhook) {
      console.error('Missing APPSCRIPT_WEBHOOK env var');
    } else {
      // fire-and-forget; we await to improve reliability but this call should be fast
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // optional: set a short timeout by not waiting too long
        });
      } catch (fwdErr) {
        console.error('Forward error:', fwdErr?.message || fwdErr);
      }
    }

    // 1x1 transparent GIF (base64)
    const img = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', img.length);
    // prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    return res.status(200).send(img);
  } catch (err) {
    console.error('Handler error:', err);
    // still return a pixel to avoid breaking email rendering
    const imgErr = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    return res.status(200).send(imgErr);
  }
}
EOF
