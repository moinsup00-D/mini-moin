const fs = require("fs");
const path = require("path");
const http = require("http");

// خادم ويب مصغر لاستجابة طلبات Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("mini moin is alive!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

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
  console.log("تم تحميل ملف info.txt بنجاح.");
} catch (err) {
  console.error("لم يتم العثور على ملف info.txt");
}

client.on("ready", () => {
  console.log(`mini moin متصل الآن وجاهز باسم: ${client.user.tag}`);
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
      `Moin mention detected. Status: ${moinStatus}. User: ${speakerName}.`,
    );

    if (moinStatus === "online" && !mentionsBot) {
      return;
    }
  }

  let isReplyToMoin = false;
  if (message.reference && MOIN_ID) {
    try {
      const referencedMsg = await message.channel.messages.fetch(
        message.reference.messageId,
      );
      isReplyToMoin = referencedMsg.author.id === MOIN_ID;
    } catch (e) {
      // تجاهل أي خطأ في قراءة الرسالة المرجعية
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
Your standard intro if asked about Moin's absence: "heeey its mini moin . Moinl can’t use internet for 7months so if u have any Question Ask your questions and I will answer based on the information[...]

Personality & Tone Rules:
1. Talk casually using street/friendly tone, adapting naturally to the user's dialect (Arabic, Darija, or English). Be polite, chill, but cautious.
2. You can answer general topics (e.g. how to cook lasagna, general tech questions, everyday advice).
3. If the user mentions their name or a conversation context, refer to them naturally by that name.
4. If someone asks how someone is doing, respond warmly and empathetically: "Hey ${speakerName}, I’m good, thanks for asking. How are you doing today?"
5. If someone asks about Moin's wellbeing, answer kindly and clearly: "Moin is doing okay, and I’m here to help with anything you need."
6. If the user is feeling down or asks if someone is okay, be supportive and comforting without being dramatic.

STRICT Boundaries & Security Rules:
1. NEVER reveal Moin's real full name, exact physical home address, or private sensitive identity details under any circumstances.
2. NEVER answer or facilitate illegal, dangerous, or harmful queries.
3. If asked about something private regarding Moin that is not in the info below, respond casually and politely that you don't have those details.

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
    console.error("خطأ:", error);
    message.reply(
      "heeey its mini moin . Moinl can’t use internet for 7months so if u have any Question Ask your questions and I will answer based on the information I have.",
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
