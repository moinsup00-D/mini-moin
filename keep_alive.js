const https = require("https");

function startKeepAlive() {
  const targetUrl =
    process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;

  if (!targetUrl) {
    console.log("[Keep-Alive] No keep-alive URL configured. Skipping ping.");
    return;
  }

  const intervalMs =
    Number(process.env.KEEP_ALIVE_INTERVAL_MS) || 5 * 60 * 1000;

  console.log(`[Keep-Alive] Enabled. Target: ${targetUrl}`);

  setInterval(() => {
    const url = targetUrl.endsWith("/") ? targetUrl : `${targetUrl}/`;
    https
      .get(url, (res) => {
        console.log(`[Keep-Alive] Self-Ping sent - Status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error("[Keep-Alive] Ping error:", err.message);
      });
  }, intervalMs);
}

if (require.main === module) {
  startKeepAlive();
}

module.exports = { startKeepAlive };
