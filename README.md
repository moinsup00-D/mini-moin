# Mini Moin - Smart Discord AI Assistant

> An intelligent, learning Discord bot that grows smarter with every conversation. Built for communities that value helpful AI support.

![Version](https://img.shields.io/badge/version-3.12.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

## What is Mini Moin?

Mini Moin is a modern Discord AI assistant designed for general public use. It is built to help communities with everyday questions, technical guidance, writing support, learning, and friendly conversation.

Unlike static bots that repeat the same replies, Mini Moin is designed to improve over time. It remembers compact context about each user, adapts to their language, and keeps interaction quality high without wasting unnecessary tokens.

## Why Mini Moin?

- Smart learning without excessive API cost
- Multilingual support for Arabic, Darija, and English
- Compact memory system for better efficiency
- Useful for communities, study groups, and support channels
- Privacy-aware design with local memory summaries
- Friendly and adaptable personality

## Features at a Glance

-  Learns from conversations with compact memory
-  Supports Arabic, Darija, and English
-  Keeps user context without overloading token usage
-  Responds quickly and naturally
-  Safe and respectful by design
-  Works for general conversation and technical help

## Quick Start

### Prerequisites

- Node.js 18+
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers)
- A Hugging Face API token from [Hugging Face](https://huggingface.co/settings/tokens)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/moinsup00-D/mini-moin.git
   cd mini-moin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   HF_TOKEN=your_huggingface_api_token_here
   PORT=3000
   ```

4. Start the bot:
   ```bash
   npm start
   ```

5. Add it to your server using your bot invite URL.

## How It Works

Mini Moin keeps a small profile for each user, including:
- preferred language
- recent conversation topics
- notable user preferences
- short memory summaries

This allows it to stay useful without sending an entire conversation history every time. Instead, it uses a compact context window to reduce token consumption and keep replies efficient.

## Project Structure

```text
mini-moin/
├── index.js
├── info.txt
├── README.md
├── memory/
│   └── user_memory.json
├── package.json
├── .env
└── .gitignore
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Your Discord bot token |
| `HF_TOKEN` | Yes | Your Hugging Face API token |
| `PORT` | No | Local port for the web server default 3000 |
| `RENDER_URL` | No | Optional Render deployment URL |

## Memory and Token Efficiency

Mini Moin uses a compact learning approach instead of sending the full chat history to the model on every request.

This means:
- lower token usage
- faster responses
- better efficiency for public use
- more sustainable deployments

## Deployment

### Local Development
```bash
npm start
```

### Render Deployment
1. Push the repository to GitHub
2. Create a new Web Service on Render
3. Connect the repo
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`

## Privacy and Safety

Mini Moin is designed with a privacy-conscious approach:
- keeps compact user memory locally
- avoids storing unnecessary sensitive data
- does not claim private personal details
- follows safe boundaries when handling requests

## Troubleshooting

### Bot not responding
- Check that the Discord bot is online
- Verify that the bot has message permissions in the server
- Make sure `DISCORD_TOKEN` is valid

### API errors
- Verify `HF_TOKEN` is valid
- Check your Hugging Face usage limits
- Review the console logs for errors

## Contributing

Contributions are welcome. If you want to improve the bot, fix bugs, or add new features:

1. Fork the repository
2. Create a feature branch
3. Make your change
4. Submit a pull request

## Roadmap

- More advanced user summaries
- Better learning personalization
- Improved server moderation tools
- Plugin-style modular features
- Better analytics and performance dashboards

## License

MIT License

## Credits

- Built with Node.js and Discord.js
- AI powered by Hugging Face Qwen 2.5
- Created by MOIN

---

Mini Moin is built to be useful, efficient, and community-friendly. It is a general-purpose AI assistant for Discord, designed to feel natural, helpful, and smart without becoming noisy or overly personal.
