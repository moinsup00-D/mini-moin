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
    console.log('جاري اختبار الاتصال بالمفتاح...');

    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'user', content: "Say 'Hello Moin' if you can read this." },
      ],
      max_tokens: 30,
    });

    console.log('\n النجاح المفتاح يعمل بنجاح.');
    console.log('رد النموذج:', response.choices[0].message.content);
  } catch (error) {
    console.error('\n فشل الاختبار! يوجد مشكلة بالمفتاح.');
    console.error('سبب الخطأ:', error.message);
  }
}

testKey();
