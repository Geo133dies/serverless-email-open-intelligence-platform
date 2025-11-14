export default async function handler(req, res) {
  console.log("=== Pixel Request Received ===");

  try {
    const { mid = "unknown", v = "" } = req.query || {};
    console.log("MID:", mid);

    const ts = new Date().toISOString();
    const ua = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "";

    console.log("User-Agent:", ua);
    console.log("IP:", ip);

    const payload = {
      mid,
      ts,
      ua,
      ip,
      forwardedFrom: "vercel",
      note: v ? `v=${v}` : "",
    };

    const webhook = process.env.APPSCRIPT_WEBHOOK;
    console.log("Webhook URL:", webhook);

    if (!webhook) {
      console.error("ERROR: Missing APPSCRIPT_WEBHOOK env var");
    } else {
      console.log("Forwarding payload to Apps Script...");
      console.log(JSON.stringify(payload));

      try {
        const resp = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("Apps Script Response Status:", resp.status);
        console.log("Apps Script Response:", await resp.text());
      } catch (forwardError) {
        console.error("FORWARD ERROR:", forwardError?.message || forwardError);
      }
    }

    const pixelGif = Buffer.from(
      "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Content-Length", pixelGif.length);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");

    return res.status(200).send(pixelGif);

  } catch (err) {
    console.error("HANDLER ERROR:", err);

    const pixelGifErr = Buffer.from(
      "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    res.setHeader("Content-Type", "image/gif");
    return res.status(200).send(pixelGifErr);
  }
}
