const http = require('http');
const https = require('https');

// إعداد خادم الويب لعرض صفحة HTML احترافية
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mini Moin AI Bot</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
            body {
                background: #0f1117;
                color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                text-align: center;
                padding: 20px;
            }
            .card {
                background: #1a1d26;
                border: 1px solid #2a2e3d;
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 480px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(34, 197, 94, 0.1);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
                padding: 6px 16px;
                border-radius: 50px;
                font-size: 0.9rem;
                font-weight: 700;
                margin-bottom: 20px;
            }
            .dot {
                width: 10px;
                height: 10px;
                background: #22c55e;
                border-radius: 50%;
                box-shadow: 0 0 10px #22c55e;
            }
            h1 { font-size: 2.2rem; font-weight: 900; margin-bottom: 10px; color: #5865F2; }
            p { color: #a3a8b8; line-height: 1.6; margin-bottom: 30px; font-size: 1rem; }
            .btn {
                display: inline-block;
                width: 100%;
                background: #5865F2;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 1.1rem;
                transition: 0.3s ease;
            }
            .btn:hover { background: #4752C4; transform: translateY(-2px); }
            .footer { margin-top: 25px; font-size: 0.85rem; color: #5c6275; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status-badge">
                <span class="dot"></span> الخدمة تعمل بنجاح (24/7)
            </div>
            <h1>Mini Moin Bot</h1>
            <p>مساعد الذكاء الاصطناعي الذكي والمرح لسيرفرات ديسكورد. جاهز لخدمتك والتفاعل معك ومع أعضاء سيرفرك في أي وقت!</p>
            <a href="https://dub.sh/mini-moin" target="_blank" class="btn">إضافة البوت إلى سيرفرك 🚀</a>
            <div class="footer">Powered by Veipex Studio • 2026</div>
        </div>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Keep-Alive] Web Page running on port ${PORT}`);
});

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

// إرسال إشارة ذكية كل 5 دقائق لمنع النوم
const RENDER_URL = 'https://mini-moin.onrender.com';
setInterval(() => {
    https.get(RENDER_URL, (res) => {
        console.log(`[Keep-Alive] Ping Status: ${res.statusCode}`);
    }).on('error', (err) => {
        console.error('[Keep-Alive] Ping Error:', err.message);
    });
}, 5 * 60 * 1000);

if (require.main === module) {
  startKeepAlive();
}

module.exports = { startKeepAlive };
