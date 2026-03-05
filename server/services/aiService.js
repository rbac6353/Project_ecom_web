/**
 * AI Product Assistant — รองรับ Groq (ลำดับแรก) และ Gemini ตอบคำถามลูกค้าเกี่ยวกับสินค้า
 * Query ข้อมูลจากตาราง product (ecom1) ผ่าน Prisma
 */
const prisma = require('../config/prisma');

const RETRY_AFTER_429_MS = 6000; // รอ 6 วินาที แล้วลองใหม่เมื่อโควต้าเกิน (Gemini Free tier)
const GROQ_MODEL = 'llama-3.1-8b-instant'; // โมเดล Groq (โควต้า Free สูง เร็ว)

const SYSTEM_PROMPT = `คุณคือผู้ช่วยอัจฉริยะประจำร้าน GTXShop ตอบคำถามลูกค้าเกี่ยวกับสินค้านี้โดยใช้ข้อมูลที่ให้มา หากในข้อมูลไม่มี (เช่น แคลอรี่) ให้ใช้ความรู้ทั่วไปตอบแทนได้แต่ต้องแจ้งว่าเป็นข้อมูลโดยประมาณ ตอบเป็นภาษาไทยที่สุภาพ เป็นมิตร และกระชับ`;

/**
 * ดึงข้อมูลสินค้าจากตาราง product ตาม productId (ecom1.product)
 * @param {number} productId
 * @returns {Promise<{ title: string, description: string | null } | null>}
 */
async function getProductInfo(productId) {
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: { title: true, description: true },
  });
  return product;
}

/**
 * เรียก Gemini generateContent ผ่าน REST API (รองรับ model ล่าสุดจาก Google AI Studio)
 * @param {string} apiKey
 * @param {string} modelId - เช่น gemini-2.0-flash, gemini-1.5-flash
 * @param {string} systemInstruction
 * @param {string} userMessage
 * @param {{ useV1?: boolean }} [opts] - useV1: ใช้ v1 แทน v1beta (เมื่อ v1beta คืน 404)
 * @returns {Promise<string>}
 */
async function generateContentRest(apiKey, modelId, systemInstruction, userMessage, opts = {}) {
  const apiVer = opts.useV1 ? 'v1' : 'v1beta';
  const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const fullUserText =
    systemInstruction && opts.useV1
      ? `${systemInstruction}\n\n---\n\n${userMessage}`
      : userMessage;
  const body =
    apiVer === 'v1beta' && systemInstruction
      ? {
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }
      : { contents: [{ role: 'user', parts: [{ text: fullUserText }] }] };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Gemini API ${res.status}: ${errText}`);
    err.status = res.status;
    err.isQuota = res.status === 429;
    throw err;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(data?.error?.message || 'ไม่ได้รับคำตอบจาก AI');
  }
  return text.trim();
}

/**
 * เรียก Groq API (OpenAI-compatible) — โควต้า Free สูง เร็ว
 * @param {string} apiKey - GROQ_API_KEY
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function generateWithGroq(apiKey, systemPrompt, userMessage) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Groq API ${res.status}: ${errText}`);
    err.status = res.status;
    err.isQuota = res.status === 429;
    throw err;
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(data?.error?.message || 'ไม่ได้รับคำตอบจาก Groq');
  }
  return text.trim();
}

/**
 * ส่งคำถาม + ข้อมูลสินค้า → ใช้ provider ที่เลือก หรือลอง Groq ก่อนแล้วค่อย Gemini
 * @param {number} productId
 * @param {string} question
 * @param {{ provider?: 'auto'|'groq'|'gemini' }} [opts] - เลือก AI: auto = Gemini ก่อนแล้ว Groq, groq = เฉพาะ Groq, gemini = เฉพาะ Gemini
 * @returns {Promise<string>}
 */
async function askProductAI(productId, question, opts = {}) {
  const provider = (opts.provider || 'auto').toLowerCase();
  if (!['auto', 'groq', 'gemini'].includes(provider)) {
    throw new Error('provider ต้องเป็น auto, groq หรือ gemini');
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!groqKey && !geminiKey) {
    throw new Error('กรุณาตั้งค่า GROQ_API_KEY หรือ GEMINI_API_KEY ใน .env');
  }

  const product = await getProductInfo(productId);
  if (!product) {
    throw new Error('ไม่พบสินค้าที่ระบุ');
  }

  const productContext = [
    `ชื่อสินค้า: ${product.title}`,
    product.description ? `รายละเอียด: ${product.description}` : 'รายละเอียด: (ไม่มีคำอธิบาย)',
  ].join('\n');

  const userMessage = `[ข้อมูลสินค้าจากร้าน]\n${productContext}\n\n[คำถามลูกค้า]\n${question}`;

  // เลือกใช้ Groq อย่างเดียว
  if (provider === 'groq') {
    if (!groqKey) throw new Error('ไม่ได้ตั้งค่า GROQ_API_KEY ใน .env');
    return await generateWithGroq(groqKey, SYSTEM_PROMPT, userMessage);
  }

  // เลือกใช้ Gemini อย่างเดียว
  if (provider === 'gemini') {
    if (!geminiKey) throw new Error('ไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env');
    // ไปใช้ logic Gemini ด้านล่าง (ไม่ลอง Groq)
    return await askWithGeminiOnly(geminiKey, userMessage);
  }

  // auto: Gemini ก่อน แล้วค่อย Groq
  if (geminiKey) {
    try {
      return await askWithGeminiOnly(geminiKey, userMessage);
    } catch (err) {
      console.warn('[AI] Gemini failed:', err.status, err.message?.slice(0, 80));
    }
  }

  if (groqKey) {
    return await generateWithGroq(groqKey, SYSTEM_PROMPT, userMessage);
  }
  throw new Error('GEMINI_API_KEY และ Groq ล้มเหลว — กรุณาตั้งค่าอย่างน้อยหนึ่งตัวใน .env');
}

/** ใช้เฉพาะ Gemini (ใช้ในกรณี provider=gemini หรือ fallback หลัง Groq ล้มเหลว) */
async function askWithGeminiOnly(geminiKey, userMessage) {
  const SUPPORTED_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const envModel = process.env.GEMINI_MODEL?.trim();
  const primaryModel =
    envModel && SUPPORTED_MODELS.includes(envModel) ? envModel : SUPPORTED_MODELS[0];
  const modelsToTry = [primaryModel, ...SUPPORTED_MODELS.filter((m) => m !== primaryModel)];

  let lastErr;
  let quotaErr = null;
  let retried429 = false;
  for (const modelId of modelsToTry) {
    for (const useV1 of [false, true]) {
      try {
        return await generateContentRest(geminiKey, modelId, SYSTEM_PROMPT, userMessage, {
          useV1,
        });
      } catch (err) {
        lastErr = err;
        if (err.status === 429 || err.isQuota) quotaErr = err;
        console.warn(
          `[AI] Gemini model=${modelId} api=${useV1 ? 'v1' : 'v1beta'} failed:`,
          err.status,
          err.message?.slice(0, 120)
        );
        if (
          (err.status === 429 || err.isQuota) &&
          modelId === primaryModel &&
          !useV1 &&
          !retried429
        ) {
          retried429 = true;
          console.warn(`[AI] โควต้าเกิน (429) รอ ${RETRY_AFTER_429_MS / 1000} วินาที แล้วลองใหม่...`);
          await new Promise((r) => setTimeout(r, RETRY_AFTER_429_MS));
          try {
            return await generateContentRest(geminiKey, modelId, SYSTEM_PROMPT, userMessage, {
              useV1: false,
            });
          } catch (retryErr) {
            lastErr = retryErr;
            if (retryErr.status === 429 || retryErr.isQuota) quotaErr = retryErr;
            console.warn('[AI] ลองใหม่หลัง 429 ไม่สำเร็จ:', retryErr.status);
          }
          break;
        }
        if (err.status === 404 && !useV1) continue;
        if (err.status === 429 || err.isQuota || err.status === 404) break;
        throw err;
      }
    }
  }
  if (quotaErr) throw quotaErr;
  throw lastErr;
}

module.exports = {
  getProductInfo,
  askProductAI,
};
