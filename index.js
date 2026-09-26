const fs = require("fs");
const path = require("path");
const express = require("express");
const https = require("https");
const { startKeepAlive } = require("./keep_alive");

const envPath = fs.existsSync(path.join(__dirname, ".env"))
  ? ".env"
  : "key.env";
require("dotenv").config({ path: path.join(__dirname, envPath) });

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { HfInference } = require("@huggingface/inference");

if (!process.env.DISCORD_TOKEN || !process.env.HF_TOKEN) {
  console.error("Missing env values. Please check key.env or .env.");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RENDER_URL = process.env.RENDER_URL || "https://mini-moin.onrender.com";

app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Mini Moin - Advanced AI Assistant for Discord Servers">
        <meta name="theme-color" content="#5865F2">
        <title>Mini Moin Bot | AI Discord Assistant</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            :root {
                --primary: #5865F2;
                --primary-dark: #4752C4;
                --bg-dark: #0f1117;
                --bg-card: #1a1d26;
                --border: #2a2e3d;
                --text-primary: #ffffff;
                --text-secondary: #a3a8b8;
                --success: #22c55e;
                --accent: #ff006e;
            }

            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, var(--bg-dark) 0%, #161b22 100%);
                color: var(--text-primary);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
            }

            .bg-animation {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                opacity: 0.5;
            }

            .blob {
                position: absolute;
                border-radius: 50%;
                background: radial-gradient(circle at 20% 50%, rgba(88, 101, 242, 0.15), rgba(255, 0, 110, 0.05));
                animation: blob-animation 8s infinite ease-in-out;
            }

            .blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation-delay: 0s; }
            .blob-2 { width: 300px; height: 300px; top: 50%; right: -50px; animation-delay: 3s; }
            .blob-3 { width: 350px; height: 350px; bottom: -100px; left: 30%; animation-delay: 6s; }

            @keyframes blob-animation {
                0%, 100% { transform: translate(0, 0); }
                33% { transform: translate(30px, -50px); }
                66% { transform: translate(-20px, 30px); }
            }

            header {
                padding: 20px;
                text-align: center;
                border-bottom: 1px solid var(--border);
                background: rgba(15, 17, 23, 0.8);
                backdrop-filter: blur(10px);
                position: sticky;
                top: 0;
                z-index: 100;
            }

            header h1 {
                font-size: 1.5rem;
                color: var(--primary);
                font-weight: 900;
                letter-spacing: 1px;
            }

            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                flex: 1;
                padding: 40px 20px;
                gap: 40px;
                flex-wrap: wrap;
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
            }

            .card {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 20px;
                padding: 40px 30px;
                width: 100%;
                max-width: 450px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .card:hover {
                border-color: var(--primary);
                box-shadow: 0 30px 80px rgba(88, 101, 242, 0.2);
                transform: translateY(-5px);
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(34, 197, 94, 0.1);
                color: var(--success);
                border: 1px solid rgba(34, 197, 94, 0.3);
                padding: 8px 16px;
                border-radius: 50px;
                font-size: 0.9rem;
                font-weight: 700;
                margin-bottom: 20px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }

            .dot {
                width: 10px;
                height: 10px;
                background: var(--success);
                border-radius: 50%;
                box-shadow: 0 0 10px var(--success);
                animation: blink 1.5s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .card h1 {
                font-size: 2.5rem;
                font-weight: 900;
                margin-bottom: 15px;
                background: linear-gradient(135deg, var(--primary), var(--accent));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: 1px;
            }

            .card p {
                color: var(--text-secondary);
                line-height: 1.8;
                margin-bottom: 30px;
                font-size: 1.05rem;
            }

            .features {
                background: rgba(88, 101, 242, 0.05);
                border: 1px solid rgba(88, 101, 242, 0.2);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                list-style: none;
            }

            .features li {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                font-size: 0.95rem;
                color: var(--text-secondary);
            }

            .features li:last-child {
                margin-bottom: 0;
            }

            .features li:before {
                content: "";
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: rgba(34, 197, 94, 0.2);
                color: var(--success);
                border-radius: 50%;
                font-weight: 900;
                font-size: 0.9rem;
                flex-shrink: 0;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                background: var(--primary);
                color: var(--text-primary);
                text-decoration: none;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 1.05rem;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3);
                margin-bottom: 12px;
            }

            .btn:hover {
                background: var(--primary-dark);
                transform: translateY(-3px);
                box-shadow: 0 15px 40px rgba(88, 101, 242, 0.4);
            }

            .btn:active {
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: transparent;
                border: 2px solid var(--primary);
                color: var(--primary);
                box-shadow: none;
            }

            .btn-secondary:hover {
                background: rgba(88, 101, 242, 0.1);
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.2);
            }

            .info-section {
                background: rgba(255, 0, 110, 0.05);
                border-left: 4px solid var(--accent);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 30px;
                font-size: 0.9rem;
                color: var(--text-secondary);
            }

            footer {
                text-align: center;
                padding: 30px 20px;
                border-top: 1px solid var(--border);
                color: #5c6275;
                font-size: 0.9rem;
                background: rgba(15, 17, 23, 0.8);
                margin-top: auto;
            }

            footer p {
                margin-bottom: 8px;
            }

            .footer-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
                margin-top: 15px;
            }

            .footer-links a {
                color: var(--primary);
                text-decoration: none;
                font-weight: 600;
                transition: color 0.3s ease;
            }

            .footer-links a:hover {
                color: var(--accent);
            }

            @media (max-width: 768px) {
                .container {
                    flex-direction: column;
                    padding: 20px;
                }

                .card {
                    max-width: 100%;
                    padding: 30px 20px;
                }

                .card h1 {
                    font-size: 2rem;
                }

                header h1 {
                    font-size: 1.2rem;
                }

                .blob-1, .blob-2, .blob-3 {
                    width: 250px;
                    height: 250px;
                }
            }

            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            .shimmer {
                animation: shimmer 2s infinite;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                background-size: 1000px 100%;
            }
        </style>
    </head>
    <body>
        <div class="bg-animation">
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
        </div>

        <header>
            <h1>Mini Moin Bot</h1>
        </header>

        <div class="container">
            <div class="card">
                <div class="status-badge">
                    <span class="dot"></span> Service running successfully (24/7)
                </div>

                <h1>Mini Moin</h1>
                <p>Advanced AI assistant for Discord servers. Ready to serve you and interact with you and your server members anytime!</p>

                <div class="features">
                    <li>Advanced AI Qwen 2.5</li>
                    <li>Support for Arabic and English languages</li>
                    <li>Fast and instant response</li>
                    <li>Safe and 100% reliable</li>
                    <li>Smart and natural conversations</li>
                    <li>Works 24/7 without interruption</li>
                </div>

                <div class="info-section">
                    INFO: The bot is connected and running. You can add it to your server now and enjoy its outstanding services!
                </div>

                <a href="https://dub.sh/mini-moin" target="_blank" class="btn">
                    Add Bot to Your Server
                </a>
                <a href="https://discord.com" target="_blank" class="btn btn-secondary">
                    Discord Link
                </a>
            </div>

            <div class="card">
                <h1 style="font-size: 2rem; margin-bottom: 20px;">Features</h1>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <h3 style="color: var(--primary); margin-bottom: 8px; font-size: 1.1rem;">Advanced Intelligence</h3>
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">Uses the latest Qwen 2.5 model from Hugging Face for smart and accurate answers.</p>
                    </div>

                    <div>
                        <h3 style="color: var(--primary); margin-bottom: 8px; font-size: 1.1rem;">Multilingual</h3>
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">Speaks Arabic, Darija and English naturally and intelligently.</p>
                    </div>

                    <div>
                        <h3 style="color: var(--primary); margin-bottom: 8px; font-size: 1.1rem;">Conversation Memory</h3>
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">Remembers previous conversations for more contextual and intelligent answers.</p>
                    </div>

                    <div>
                        <h3 style="color: var(--primary); margin-bottom: 8px; font-size: 1.1rem;">Safe and Reliable</h3>
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">Secure data and your privacy protected to the highest standards.</p>
                    </div>

                    <div>
                        <h3 style="color: var(--primary); margin-bottom: 8px; font-size: 1.1rem;">Very Fast</h3>
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">Instant response without any delay or slowness.</p>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>Mini Moin Bot (c) 2026 | Advanced AI Assistant</p>
            <div class="footer-links">
                <a href="https://discord.com" target="_blank">Discord</a>
                <a href="https://dub.sh/mini-moin" target="_blank">Add Bot</a>
                <a href="#" target="_blank">Technical Support</a>
            </div>
            <p style="margin-top: 15px; font-size: 0.85rem;">Powered by Veipex Studio</p>
        </footer>

        <script>
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('Button clicked:', this.textContent);
                });
            });

            setInterval(async () => {
                try {
                    const response = await fetch('/health');
                    const data = await response.json();
                    console.log('Bot Status:', data);
                } catch (error) {
                    console.warn('Health check failed:', error.message);
                }
            }, 30000);
        </script>
    </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mini-moin-bot",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`HTTP server is running on port ${PORT}`);
  console.log(`Web page available at: http://localhost:${PORT}`);
});

startKeepAlive();

function keepServerAlive() {
  setInterval(() => {
    https
      .get(RENDER_URL, (res) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Keep-Alive Ping - Status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error(`[Keep-Alive] Ping Error: ${err.message}`);
      });
  }, 5 * 60 * 1000);
}

keepServerAlive();
console.log("Keep-Alive system started. Ping interval: every 5 minutes");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const hf = new HfInference(process.env.HF_TOKEN);
const MOIN_ID = process.env.MOIN_USER_ID;

async function getUserStatusText(userId, guild) {
  if (!userId || !guild) return "unknown";

  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return "offline";

    const status = member.presence?.status || "offline";
    const map = {
      online: "online",
      idle: "idle",
      dnd: "busy",
      offline: "offline",
      invisible: "invisible",
    };

    return map[status] || "unknown";
  } catch (e) {
    return "unknown";
  }
}

const processedMessages = new Set();
const userMemory = new Map();

let infoData = "";
try {
  infoData = fs.readFileSync("info.txt", "utf8");
  console.log("Successfully loaded info.txt file.");
} catch (err) {
  console.error("info.txt file not found");
}

client.on("ready", () => {
  console.log(`Discord Bot Status:`);
  console.log(`Connected as: ${client.user.tag}`);
  console.log(`Bot ID: ${client.user.id}`);
  console.log(`Time: ${new Date().toISOString()}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.author.id === client.user.id) return;
  if (processedMessages.has(message.id)) return;

  processedMessages.add(message.id);
  setTimeout(() => {
    processedMessages.delete(message.id);
  }, 5000);

  const isDM = !message.guild;
  const mentionsBot = message.mentions.has(client.user.id);
  const mentionsMoin = !!(MOIN_ID && message.mentions.has(MOIN_ID));

  const speakerName =
    message.member?.displayName ||
    message.author.globalName ||
    message.author.username ||
    "Unknown user";

  const isSelfPing = mentionsBot;

  let moinStatus = "unknown";
  if (message.guild) {
    moinStatus = await getUserStatusText(MOIN_ID, message.guild);
  }

  if (MOIN_ID && message.mentions.has(MOIN_ID)) {
    console.log(
      `Moin mention detected. Status: ${moinStatus}. User: ${speakerName}.`
    );

    if (moinStatus === "online" && !mentionsBot) {
      return;
    }
  }

  let isReplyToMoin = false;
  if (message.reference && MOIN_ID) {
    try {
      const referencedMsg = await message.channel.messages.fetch(
        message.reference.messageId
      );
      isReplyToMoin = referencedMsg.author.id === MOIN_ID;
    } catch (e) {
    }
  }

  const shouldAnswer =
    isDM || mentionsBot || isSelfPing || mentionsMoin || isReplyToMoin;

  if (!shouldAnswer) return;

  const userId = message.author.id;

  if ("sendTyping" in message.channel) {
    await message.channel.sendTyping();
  }

  const systemPrompt = `You are mini moin, an AI assistant representing Moinl (Moin).

Current user context:
- The person speaking is: ${speakerName}
- Moin's current presence status: ${moinStatus}
- Moin's user ID: ${MOIN_ID || "unknown"}
- If Moin is online, do not pretend to be Moin and do not reply to mentions of Moin.
- If Moin is offline, say it politely and help the user without pretending Moin is online.

Greeting Context / Fixed Response Rules:
Your standard intro if asked about Moin's absence: "heeey its mini moin. Moinl can't use internet for 7 months so if you have any questions ask and I will answer based on the information I have."

Personality & Tone Rules:
1. Talk casually using friendly tone, adapting naturally to the user's dialect. Be polite, chill, but cautious.
2. You can answer general topics like how to cook lasagna, general tech questions, everyday advice.
3. If the user mentions their name or a conversation context, refer to them naturally by that name.
4. If someone asks how someone is doing, respond warmly and empathetically: "Hey ${speakerName}, I am good, thanks for asking. How are you doing today?"
5. If someone asks about Moin's wellbeing, answer kindly and clearly: "Moin is doing okay, and I am here to help with anything you need."
6. If the user is feeling down or asks if someone is okay, be supportive and comforting without being dramatic.

STRICT Boundaries & Security Rules:
1. NEVER reveal Moin's real full name, exact physical home address, or private sensitive identity details under any circumstances.
2. NEVER answer or facilitate illegal, dangerous, or harmful queries.
3. If asked about something private regarding Moin that is not in the info below, respond casually and politely that you do not have those details.

Knowledge Base provided by Moin:
${infoData}`;

  let history = userMemory.get(userId) || [];

  const messagesToSend = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message.content },
  ];

  try {
    const response = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: messagesToSend,
      max_tokens: 300,
    });

    const aiReply = response.choices[0].message.content;

    await message.reply(aiReply);

    history.push({ role: "user", content: message.content });
    history.push({ role: "assistant", content: aiReply });

    if (history.length > 6) {
      history = history.slice(history.length - 6);
    }

    userMemory.set(userId, history);
  } catch (error) {
    console.error("Error:", error.message);
    message.reply(
      "heeey its mini moin. Moinl can't use internet for 7 months so if you have any questions ask and I will answer based on the information I have."
    );
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("Failed to login to Discord:", error);
  server.close(() => process.exit(1));
});

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  server.close(() => process.exit(0));
});
