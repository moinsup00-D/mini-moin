const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const envPath = fs.existsSync(path.join(__dirname, '.env')) ? '.env' : 'key.env';
require('dotenv').config({ path: path.join(__dirname, envPath) });

if (!process.env.HF_TOKEN) {
  console.error('HF_TOKEN not found. Please check key.env or .env.');
  process.exit(1);
}

const hf = new HfInference(process.env.HF_TOKEN);

async function testKey() {
  try {
    console.log('TESTING BRO...');

    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'user', content: "Say 'Hello WORLD' if you can read this." },
      ],
      max_tokens: 30,
    });

    console.log('\n UR GOOD.');
    console.log('رد النموذج:', response.choices[0].message.content);
  } catch (error) {
    console.error('\n UR NOT GOOD.');
    console.error('THATS WHY:', error.message);
  }
}

testKey();
