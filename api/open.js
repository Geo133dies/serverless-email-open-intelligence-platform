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
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      '';

    const payload = {
      mid,
      ts,
      ua,
      ip,
      forwardedFrom: 'vercel',
      note: v ? `v=${v}` : ''
    };

    const webhook = process.env.APPSCRIPT_WEBHOOK;

    if (!webhook) {
      console.error('Missing APPSCRIPT_WEBHOOK env var');
    } else {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
        });
      } catch (forwardError) {
        console.error('Forward error:', forwardError?.message || forwardError);
      }
    }

    // Transparent 1x1 GIF
    const pixelGif = Buffer.from(
      'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64'
    );

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', pixelGif.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    return res.status(200).send(pixelGif);

  } catch (error) {
    console.error('Handler error:', error);

    const pixelGifErr = Buffer.from(
      'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64'
    );

    res.setHeader('Content-Type', 'image/gif');
    return res.status(200).send(pixelGifErr);
  }
}
