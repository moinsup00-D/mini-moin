const fs = require("fs");
const path = require("path");
const express = require("express");
const https = require("https");
const { startKeepAlive } = require("./keep_alive");

const envPath = fs.existsSync(path.join(__dirname, ".env")) ? ".env" : "key.env";
require("dotenv").config({ path: path.join(__dirname, envPath) });

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { HfInference } = require("@huggingface/inference");

if (!process.env.DISCORD_TOKEN || !process.env.HF_TOKEN) {
  console.error("Missing env values. Check .env or key.env");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RENDER_URL = process.env.RENDER_URL || "https://mini-moin.onrender.com";

const MEMORY_DIR = path.join(__dirname, "memory");
const MEMORY_FILE = path.join(MEMORY_DIR, "user_memory.json");
fs.mkdirSync(MEMORY_DIR, { recursive: true });

function loadJsonSafe(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf8");
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("Couldn't save file:", err.message);
  }
}

function validateProfile(p) {
  return {
    language: p.language || "en",
    topics: Array.isArray(p.topics) ? p.topics : [],
    notes: Array.isArray(p.notes) ? p.notes : [],
    lastMessages: Array.isArray(p.lastMessages) ? p.lastMessages : [],
    interactions: Number(p.interactions) || 0,
  };
}

function getProfile(userKey) {
  const store = loadJsonSafe(MEMORY_FILE);
  return validateProfile(store[userKey] || {});
}

function saveProfile(userKey, profile) {
  const store = loadJsonSafe(MEMORY_FILE);
  store[userKey] = validateProfile(profile);
  saveJsonFile(MEMORY_FILE, store);
}

function trimText(text, maxLen = 400) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function detectTopics(msg) {
  const text = String(msg || "").toLowerCase();
  const topics = ["coding", "ai", "discord", "writing", "study", "learning", "music", "game", "security"]
    .filter((topic) => text.includes(topic));

  return {
    topics: [...new Set(topics)].slice(0, 5),
    language: /(عربي|دارجة|arabic|ar)/i.test(text) ? "ar" : "en",
  };
}

function updateProfile(userKey, userName, userMsg, botReply) {
  const profile = getProfile(userKey);
  const signals = detectTopics(userMsg);

  profile.language = signals.language || profile.language;
  profile.topics = [...new Set([...profile.topics, ...signals.topics])].slice(-8);
  profile.interactions += 1;
  profile.lastMessages.push({ role: "user", content: trimText(userMsg, 250) });
  profile.lastMessages.push({ role: "assistant", content: trimText(botReply, 250) });
  profile.lastMessages = profile.lastMessages.slice(-6);

  if (/\?/.test(userMsg) || /prefer|favorite|like|help/i.test(userMsg.toLowerCase())) {
    profile.notes.push(`${userName}: ${trimText(userMsg, 150)}`);
    profile.notes = profile.notes.slice(-4);
  }

  saveProfile(userKey, profile);
}

function buildPrompt(userName, profile, kb) {
  const topics = profile.topics.length ? profile.topics.join(", ") : "general stuff";

  return `You're Mini Moin, a Discord bot. Keep it real and casual.

About ${userName}:
- Language: ${profile.language === "ar" ? "Arabic/Darija" : "English"}
- Topics: ${topics}
- Previous notes: ${profile.notes.length ? profile.notes.join(" | ") : "none"}

Respond in the user's language, keep answers natural and reasonably short, and help with coding, questions, or general chat. Respect privacy and be honest when you are unsure.
${kb ? `\nLocal info:\n${kb}` : ""}`;
}

app.get("/", (req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Mini Moin is a simple Discord bot for everyday conversations.">
  <title>Mini Moin — Discord bot</title>
  <style>
    :root {
      --ink: #20242a;
      --muted: #69717c;
      --line: #e7e9ec;
      --paper: #ffffff;
      --soft: #f6f7f8;
      --blue: #5865f2;
      --blue-dark: #4752c4;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    a { color: inherit; }
    .wrap { width: min(1080px, calc(100% - 40px)); margin: auto; }
    header {
      border-bottom: 1px solid var(--line);
      background: rgba(255,255,255,.94);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    nav {
      min-height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; text-decoration: none; }
    .mark {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: var(--blue);
      color: white;
      font-size: 14px;
    }
    .nav-links { display: flex; gap: 22px; color: var(--muted); font-size: 14px; }
    .nav-links a { text-decoration: none; }
    .nav-links a:hover { color: var(--ink); }
    main { overflow: hidden; }
    .hero { padding: 96px 0 84px; background: linear-gradient(180deg, #fbfbfc 0%, #fff 100%); }
    .hero-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 70px; align-items: center; }
    .eyebrow { color: var(--blue); font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { max-width: 650px; margin: 14px 0 18px; font-size: clamp(2.5rem, 6vw, 4.7rem); line-height: 1.05; letter-spacing: -.055em; }
    .lead { max-width: 560px; color: var(--muted); font-size: 1.14rem; margin: 0 0 30px; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; }
    .button { display: inline-flex; align-items: center; justify-content: center; padding: 12px 18px; border: 1px solid var(--blue); border-radius: 7px; text-decoration: none; font-weight: 600; font-size: 14px; transition: .2s ease; }
    .button.primary { color: #fff; background: var(--blue); }
    .button.primary:hover { background: var(--blue-dark); border-color: var(--blue-dark); }
    .button.secondary { color: var(--ink); border-color: var(--line); background: #fff; }
    .button.secondary:hover { border-color: #c9cdd3; background: var(--soft); }
    .note { margin-top: 18px; color: var(--muted); font-size: 13px; }
    .preview { padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: 0 18px 50px rgba(32,36,42,.08); }
    .window-top { display: flex; gap: 6px; padding-bottom: 18px; border-bottom: 1px solid var(--line); }
    .window-top span { width: 8px; height: 8px; border-radius: 50%; background: #d9dde2; }
    .message { display: flex; gap: 12px; padding: 18px 0; border-bottom: 1px solid var(--line); }
    .message:last-child { border-bottom: 0; padding-bottom: 4px; }
    .avatar { flex: 0 0 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #eef0ff; color: var(--blue); font-weight: 700; }
    .message strong { display: block; font-size: 14px; }
    .message p { margin: 3px 0 0; color: var(--muted); font-size: 14px; }
    section { padding: 80px 0; }
    .section-head { max-width: 560px; margin-bottom: 32px; }
    h2 { margin: 0 0 10px; font-size: 2rem; letter-spacing: -.03em; }
    .section-head p { margin: 0; color: var(--muted); }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .feature { padding: 24px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
    .feature-number { color: var(--blue); font-weight: 700; font-size: 13px; }
    .feature h3 { margin: 18px 0 8px; font-size: 17px; }
    .feature p { margin: 0; color: var(--muted); font-size: 14px; }
    .how { background: var(--soft); }
    .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 34px; }
    .step strong { display: block; margin-bottom: 7px; }
    .step p { margin: 0; color: var(--muted); font-size: 14px; }
    footer { padding: 28px 0; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
    .footer-inner { display: flex; justify-content: space-between; gap: 20px; }
    .footer-inner a { text-decoration: none; }
    .footer-inner a:hover { color: var(--ink); }
    @media (max-width: 760px) {
      .wrap { width: min(100% - 28px, 600px); }
      .nav-links { display: none; }
      .hero { padding: 64px 0; }
      .hero-grid, .features, .how-grid { grid-template-columns: 1fr; gap: 24px; }
      section { padding: 58px 0; }
      h1 { font-size: 3rem; }
      .footer-inner { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header>
    <nav class="wrap">
      <a class="brand" href="/"><span class="mark">M</span> Mini Moin</a>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="https://github.com/moinsup00-D/mini-moin">GitHub</a>
      </div>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">A Discord bot made for conversation</div>
          <h1>Simple help, right where your community chats.</h1>
          <p class="lead">Mini Moin answers questions, helps with code, and keeps conversations moving in Arabic, Darija, and English.</p>
          <div class="actions">
            <a class="button primary" href="https://dub.sh/mini-moin">Add to Discord</a>
            <a class="button secondary" href="https://github.com/moinsup00-D/mini-moin">See the project</a>
          </div>
          <p class="note">Open source project by MOIN. Built with Node.js and Qwen.</p>
        </div>

        <div class="preview" aria-label="Example conversation">
          <div class="window-top"><span></span><span></span><span></span></div>
          <div class="message"><div class="avatar">M</div><div><strong>Mini Moin</strong><p>Hey. Mention me whenever you need a hand.</p></div></div>
          <div class="message"><div class="avatar">Y</div><div><strong>You</strong><p>Can you explain this JavaScript error?</p></div></div>
          <div class="message"><div class="avatar">M</div><div><strong>Mini Moin</strong><p>Sure — send the error and the small part of your code around it.</p></div></div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap">
        <div class="section-head"><h2>Useful without getting in the way.</h2><p>It stays quiet until someone needs it, then joins the conversation naturally.</p></div>
        <div class="features">
          <article class="feature"><div class="feature-number">01</div><h3>Natural replies</h3><p>Talk normally. Mini Moin understands Arabic, Darija, and English.</p></article>
          <article class="feature"><div class="feature-number">02</div><h3>Helpful context</h3><p>Recent messages and small user preferences help keep replies relevant.</p></article>
          <article class="feature"><div class="feature-number">03</div><h3>Easy to use</h3><p>Mention the bot in a channel or send a direct message. That is all.</p></article>
        </div>
      </div>
    </section>

    <section id="how" class="how">
      <div class="wrap">
        <div class="section-head"><h2>Start in a minute.</h2><p>No complicated setup for your members.</p></div>
        <div class="how-grid">
          <div class="step"><strong>01 — Add the bot</strong><p>Invite Mini Moin to your Discord server.</p></div>
          <div class="step"><strong>02 — Mention it</strong><p>Ask a question in a channel or send a DM.</p></div>
          <div class="step"><strong>03 — Keep chatting</strong><p>It remembers a little context to make future replies better.</p></div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap footer-inner"><span>© 2026 Mini Moin</span><span><a href="https://github.com/moinsup00-D/mini-moin">GitHub</a> · Made by MOIN</span></div>
  </footer>
</body>
</html>
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Keep the server awake on Render.
startKeepAlive();

function setupKeepAlive() {
  setInterval(() => {
    https
      .get(RENDER_URL, (res) => {
        console.log(`[${new Date().toISOString()}] Keep-alive ping - Status: ${res.statusCode}`);
        res.resume();
      })
      .on("error", (err) => console.warn(`[Keep-alive] Error: ${err.message}`));
  }, 4 * 60 * 1000);
}

setupKeepAlive();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const hf = new HfInference(process.env.HF_TOKEN);
const processedMsgs = new Set();

let knowledgeBase = "";
try {
  knowledgeBase = fs.readFileSync(path.join(__dirname, "info.txt"), "utf8");
  console.log("Loaded knowledge base");
} catch {
  console.log("No info.txt found");
}

client.on("ready", () => {
  console.log(`Bot ready as ${client.user.tag}`);
  client.user.setPresence({ activities: [{ name: "messages | try mentioning me" }], status: "online" });
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || msg.author.id === client.user.id) return;
  if (processedMsgs.has(msg.id)) return;

  processedMsgs.add(msg.id);
  setTimeout(() => processedMsgs.delete(msg.id), 3000);

  const isDM = !msg.guild;
  if (!isDM && !msg.mentions.has(client.user.id)) return;

  const key = `${msg.author.id}_${msg.guildId || "dm"}`;
  const name = msg.member?.displayName || msg.author.username || "friend";
  const profile = getProfile(key);
  const messages = [
    { role: "system", content: buildPrompt(name, profile, knowledgeBase) },
    ...profile.lastMessages.slice(-4),
    { role: "user", content: msg.content },
  ];

  try {
    if (msg.channel.sendTyping) await msg.channel.sendTyping();

    const result = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages,
      max_tokens: 250,
    });

    const reply = result.choices[0].message.content;
    const chunks = reply.length > 2000 ? reply.match(/[\s\S]{1,1900}/g) || [] : [reply];
    for (const chunk of chunks) await msg.reply(chunk);
    updateProfile(key, name, msg.content, reply);
  } catch (err) {
    console.error("Error:", err.message);
    msg.reply(isDM ? "Oops, something broke. Try again?" : "Something went wrong, will try again soon").catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("Failed to login:", err.message);
  process.exit(1);
});

function shutdown() {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
