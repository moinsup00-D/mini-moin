# Mini Moin Bot

A simple Discord bot powered by Node.js and Hugging Face Inference.

## Features

- Responds to mentions and DMs
- Uses a local knowledge base from `info.txt`
- Tracks Moin presence status and ignores mentions when Moin is online
- Friendly and empathetic conversational tone

## Requirements

- Node.js 18+
- A Discord bot token
- A Hugging Face token
- A valid Moin user ID

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```env
   DISCORD_TOKEN=your_discord_token_here
   HF_TOKEN=your_huggingface_token_here
   MOIN_USER_ID=your_moin_user_id_here
   ```
3. Start the bot:
   ```bash
   npm start
   ```

## Notes

- Do not upload your `.env` file to GitHub.
- Keep all sensitive tokens in local environment variables only.
- The bot reads the local knowledge base from `info.txt`.
